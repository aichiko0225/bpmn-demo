<template>
  <div class="roadmap-process-modal-container">
    <div class="roadmap-process-modal">
      <div ref="canvasRef" class="bpmn-canvas"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import 'bpmn-js/dist/assets/diagram-js.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-codes.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css'
import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer'
import {
  ROADMAP_XML,
  roleRendererModule,
  WHOLE_VEHICLE_TASK_STATUS,
  FLOW_MARKERS_BY_STATUS,
  CANCEL_FLOW_IDS,
  CANCEL_LABEL_IDS,
  buildMockRecord,
} from './process-helpers'


/** @type {NavigatedViewer} */
const viewer = ref(null)
const canvasRef = ref(null)

const buildRoadmapMarkersByRecord = (record) => {
  const history = record && Array.isArray(record.history) ? record.history : []
  const currentStatus = record && record.status
  const cancelStatuses = [
    WHOLE_VEHICLE_TASK_STATUS.CANCEL_PENDING,
    WHOLE_VEHICLE_TASK_STATUS.CANCELED,
  ]
  const isCancelStatus = (status) => cancelStatuses.includes(status)
  const cancelStatus = isCancelStatus(currentStatus) ? currentStatus : ''

  const historyFlowIds = new Set()
  const cancelFlowIds = new Set()
  const currentFlowIds = new Set()
  const hiddenFlowIds = new Set()

  const addFlows = (ids) => {
    if (!Array.isArray(ids)) {
      return
    }
    ids.forEach((flowId) => historyFlowIds.add(flowId))
  }
  const addHiddenFlows = (ids) => {
    if (!Array.isArray(ids)) {
      return
    }
    ids.forEach((flowId) => hiddenFlowIds.add(flowId))
  }

  const addCancelFlows = (ids) => {
    if (!Array.isArray(ids)) {
      return
    }
    ids.forEach((flowId) => cancelFlowIds.add(flowId))
  }

  const addCurrentFlows = (ids) => {
    if (!Array.isArray(ids)) {
      return
    }
    ids.forEach((flowId) => currentFlowIds.add(flowId))
  }

  history.forEach((item) => {
    const fromStatus = item && item.fromStatus
    const toStatus = item && item.toStatus
    const remark = (item && item.remark) || ''
    if (!fromStatus && !toStatus) {
      return
    }

    let roleName = ''
    if (remark.includes('Leader')) {
      roleName = 'Leader'
    } else if (remark.includes('Executor')) {
      roleName = 'Executor'
    } else if (remark.includes('Client')) {
      roleName = 'Client'
    } else {
      roleName = 'Executor'
    }

    if (toStatus && isCancelStatus(toStatus)) {
      if (toStatus === WHOLE_VEHICLE_TASK_STATUS.CANCEL_PENDING) {
        if (fromStatus === WHOLE_VEHICLE_TASK_STATUS.UNASSIGNED) {
          addCancelFlows(['Flow_RoleClient_To_LeaderCancel'])
        } else if (fromStatus === WHOLE_VEHICLE_TASK_STATUS.ASSIGNED) {
          addCancelFlows(['Flow_RoleExecutor_To_LeaderCancel'])
        } else if (roleName === 'Leader') {
          addCancelFlows(['Flow_RoleLeader_To_LeaderCancel'])
        } else if (roleName === 'Executor') {
          addCancelFlows(['Flow_RoleExecutor_To_LeaderCancel'])
        } else if (roleName === 'Client') {
          addCancelFlows(['Flow_RoleClient_To_LeaderCancel'])
        }
      }
      return
    }

    if (toStatus === WHOLE_VEHICLE_TASK_STATUS.ASSIGNED) {
      if (fromStatus === WHOLE_VEHICLE_TASK_STATUS.UNASSIGNED) {
        addFlows(['Flow_LeaderApproval1_To_Assign'])
      } else if (fromStatus === WHOLE_VEHICLE_TASK_STATUS.DRAFT) {
        addFlows(['Flow_Apply_To_ClientApproval2'])
      } else if (fromStatus === WHOLE_VEHICLE_TASK_STATUS.REJECT_PENDING_1) {
        const agreed = remark.includes('Leader agreed executor reject')
        if (agreed) {
          addFlows(['Flow_LeaderApproval2_To_Apply'])
          addFlows(['Flow_Apply_To_ClientApproval1', 'Flow_LeaderApproval1_To_Assign'])
        } else {
          addFlows(['Flow_LeaderApproval2_To_ExecAR1'])
        }
      } else if (fromStatus === WHOLE_VEHICLE_TASK_STATUS.REJECT_PENDING_2) {
        const agreed = remark.includes('Leader agreed executor reject')
        if (agreed) {
          addFlows(['Flow_LeaderApproval3_To_Apply'])
          addFlows(['Flow_Apply_To_ClientApproval1', 'Flow_LeaderApproval1_To_Assign'])
        } else {
          addFlows(['Flow_LeaderApproval4_To_Analysis'])
        }
      }
      return
    }

    if (toStatus === WHOLE_VEHICLE_TASK_STATUS.PART_REGISTERED || toStatus === WHOLE_VEHICLE_TASK_STATUS.APPROVED) {
      if (fromStatus === WHOLE_VEHICLE_TASK_STATUS.REJECT_PENDING_2) {
        addFlows(['Flow_LeaderApproval4_To_Analysis'])
        return
      }
    }

    if (toStatus === WHOLE_VEHICLE_TASK_STATUS.REJECTED) {
      if (fromStatus === WHOLE_VEHICLE_TASK_STATUS.REJECT_PENDING_1) {
        addFlows(['Flow_LeaderApproval2_To_Apply'])
      } else if (fromStatus === WHOLE_VEHICLE_TASK_STATUS.REJECT_PENDING_2) {
        addFlows(['Flow_LeaderApproval3_To_Apply'])
      }
      return
    }

    const key = toStatus
    addFlows(FLOW_MARKERS_BY_STATUS[key])
  })

  if (
    currentStatus === WHOLE_VEHICLE_TASK_STATUS.CANCELED
    && cancelFlowIds.size === 0
  ) {
    addCancelFlows(['Flow_RoleLeader_To_LeaderCancel'])
  }

  const containRejectFlow = historyFlowIds.has('Flow_LeaderApproval2_To_Apply')
    || historyFlowIds.has('Flow_LeaderApproval3_To_Apply')
  if (currentStatus === WHOLE_VEHICLE_TASK_STATUS.REJECTED && !containRejectFlow) {
    addFlows(['Flow_LeaderApproval1_To_Apply'])
  }

  const taskPending = ![
    WHOLE_VEHICLE_TASK_STATUS.DRAFT,
    WHOLE_VEHICLE_TASK_STATUS.CANCELED,
    WHOLE_VEHICLE_TASK_STATUS.CLOSED,
    WHOLE_VEHICLE_TASK_STATUS.REJECTED,
    WHOLE_VEHICLE_TASK_STATUS.COMPLETED,
  ].includes(currentStatus)

  if (taskPending && history.length > 0) {
    const lastHistoryItem = history[history.length - 1]
    const lastToStatus = lastHistoryItem && lastHistoryItem.toStatus
    const lastFromStatus = lastHistoryItem && lastHistoryItem.fromStatus
    const flowIds = FLOW_MARKERS_BY_STATUS[lastToStatus]
    if (
      lastToStatus === WHOLE_VEHICLE_TASK_STATUS.REJECT_PENDING_1
      || lastToStatus === WHOLE_VEHICLE_TASK_STATUS.REJECT_PENDING_2
    ) {
      addCurrentFlows(flowIds)
    } else if (lastToStatus === WHOLE_VEHICLE_TASK_STATUS.ASSIGNED) {
      if (lastFromStatus === WHOLE_VEHICLE_TASK_STATUS.REJECT_PENDING_1) {
        const remark = lastHistoryItem && lastHistoryItem.remark
        const agreed = remark && remark.includes('Leader agreed executor reject')
        if (agreed) {
          addCurrentFlows(['Flow_ExecAR1_To_RejectPending2'])
        } else {
          addCurrentFlows(['Flow_LeaderApproval2_To_ExecAR1'])
        }
      }
    }
  }

  if (history.length > 0) {
    const haveApproved = history.slice(0, -1).some(
      (item) => item.toStatus === WHOLE_VEHICLE_TASK_STATUS.APPROVED,
    )
    if (history.length > 0 && haveApproved) {
      const havePartRegistered = history.some(
        (item) => item.toStatus === WHOLE_VEHICLE_TASK_STATUS.PART_REGISTERED,
      )
      if (!havePartRegistered) {
        addHiddenFlows(['Flow_ExecAR1_To_Register', 'Flow_Register_To_ExecAR2'])
        addFlows(['Flow_ExecAR1_To_ExecAR2'])
      } else {
        addHiddenFlows(['Flow_ExecAR1_To_ExecAR2'])
      }
    }
  }

  return {
    historyFlowIds,
    cancelStatus,
    cancelFlowIds,
    currentFlowIds,
    hiddenFlowIds,
  }
}

const applyRoadmapMarkers = (bpmnCanvas, markerPayload) => {
  if (!bpmnCanvas || !markerPayload) {
    return
  }

  const laneIds = [
    'Lane_Client_Role',
    'Lane_Leader_Role',
    'Lane_Executor_Role',
    'Lane_Blue_Collar_Role',
  ]
  laneIds.forEach((laneId) => {
    bpmnCanvas.addMarker(laneId, 'lane-visual')
  })

  const {
    historyFlowIds,
    cancelStatus,
    cancelFlowIds,
    currentFlowIds,
    hiddenFlowIds,
  } = markerPayload
  console.log('historyFlowIds', historyFlowIds)
  console.log('cancelStatus', cancelStatus)
  console.log('cancelFlowIds', cancelFlowIds)
  console.log('currentFlowIds', currentFlowIds)
  console.log('hiddenFlowIds', hiddenFlowIds)

  const cancelFlowIdList = Array.from(cancelFlowIds)
  CANCEL_FLOW_IDS.forEach((flowId) => bpmnCanvas.addMarker(flowId, 'line-hidden'))
  CANCEL_LABEL_IDS.forEach((labelId) => bpmnCanvas.addMarker(labelId, 'line-hidden'))

  if (cancelStatus) {
    cancelFlowIdList.forEach((flowId) => bpmnCanvas.removeMarker(flowId, 'line-hidden'))
    const cancelLabelIds = cancelFlowIdList.map((flowId) => `${flowId}_label`)
    cancelLabelIds.forEach((labelId) => bpmnCanvas.removeMarker(labelId, 'line-hidden'))
    if (cancelStatus === WHOLE_VEHICLE_TASK_STATUS.CANCEL_PENDING) {
      cancelFlowIdList.forEach((flowId) => bpmnCanvas.addMarker(flowId, 'cancel-approve-line'))
      cancelFlowIdList.forEach((flowId) => bpmnCanvas.addMarker(flowId, 'line-animation'))
    } else {
      cancelFlowIdList.forEach((flowId) => bpmnCanvas.addMarker(flowId, 'cancel-request-line'))
    }
  }

  if (historyFlowIds) {
    historyFlowIds.forEach((flowId) => bpmnCanvas.addMarker(flowId, 'line-history'))
  }

  if (currentFlowIds && currentFlowIds.size > 0) {
    currentFlowIds.forEach((flowId) => bpmnCanvas.addMarker(flowId, 'line-current'))
    currentFlowIds.forEach((flowId) => bpmnCanvas.addMarker(flowId, 'line-animation'))
  }

  if (hiddenFlowIds && hiddenFlowIds.size > 0) {
    hiddenFlowIds.forEach((flowId) => bpmnCanvas.addMarker(flowId, 'line-hidden'))
    const hiddenFlowIdList = Array.from(hiddenFlowIds)
    const hiddenLabelIds = hiddenFlowIdList.map((flowId) => `${flowId}_label`)
    hiddenLabelIds.forEach((labelId) => bpmnCanvas.addMarker(labelId, 'line-hidden'))
  }
}

const renderRoadmap = async () => {
  if (!canvasRef.value) {
    return
  }
  if (viewer.value) {
    try {
      viewer.value.destroy()
    } catch (e) { }
    viewer.value = null
  }
  viewer.value = new NavigatedViewer({
    container: canvasRef.value,
    keyboard: { bindTo: canvasRef.value },
    additionalModules: [roleRendererModule],
  })
  await viewer.value.importXML(ROADMAP_XML)
  const bpmnCanvas = viewer.value.get('canvas')
  bpmnCanvas.zoom('fit-viewport')
  const mockRecord = buildMockRecord()
  const markerPayload = buildRoadmapMarkersByRecord(mockRecord)
  applyRoadmapMarkers(bpmnCanvas, markerPayload)
}

onMounted(async () => {
  await nextTick()
  await renderRoadmap()
})

onBeforeUnmount(() => {
  if (!viewer.value) {
    return
  }
  try {
    viewer.value.destroy()
  } catch (e) { }
  viewer.value = null
})

</script>

<style scoped>
.roadmap-process-modal-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.roadmap-process-modal {
  background-color: #fff;
  width: 95vw;
  height: 95vh;
  padding: 12px;
  box-sizing: border-box;
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.bpmn-canvas {
  width: 100%;
  height: 100%;
  background: #fff;
}

::v-deep .line-hidden {
  display: none !important;
}

/* animation line */
::v-deep .line-animation .djs-visual path {
  stroke-dasharray: 10, 10;
  animation: flow-animation 1s linear infinite;
}

::v-deep .line-animation .djs-visual polyline {
  stroke-dasharray: 10, 10;
  animation: flow-animation 1s linear infinite;
}

@keyframes flow-animation {
  from {
    stroke-dashoffset: 20;
  }

  to {
    stroke-dashoffset: 0;
  }
}

/* canceled line */
::v-deep .cancel-request-line path {
  stroke: #ff4757 !important;
}

::v-deep .cancel-request-line .djs-visual path {
  stroke: #ff4757 !important;
}

::v-deep .cancel-request-line .djs-visual polyline {
  stroke: #ff4757 !important;
}

/*  cancel approve line */
::v-deep .cancel-approve-line .djs-visual path {
  stroke: #f1c40f !important;
  stroke-width: 2.5px !important;
}

::v-deep .cancel-approve-history .djs-visual polyline {
  stroke: #f1c40f !important;
  stroke-width: 2.5px !important;
}

/* history line */
::v-deep .line-history .djs-visual path {
  stroke: #2ecc71 !important;
  stroke-width: 3px !important;
}

::v-deep .line-history .djs-visual polyline {
  stroke: #2ecc71 !important;
  stroke-width: 3px !important;
}

/* current line */
::v-deep .line-current .djs-visual path {
  stroke: #3b82f6 !important;
  stroke-width: 3px !important;
}

::v-deep .line-current .djs-visual polyline {
  stroke: #3b82f6 !important;
  stroke-width: 3px !important;
}

/* lane line */
::v-deep .lane-visual .djs-visual rect {
  stroke: #D9D9D9 !important;
}

::v-deep .lane-visual .djs-visual text {
  color: #242D58 !important;
}
</style>
