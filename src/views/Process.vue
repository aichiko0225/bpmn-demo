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
  CANCEL_FLOW_IDS,
} from './process-helpers'


/** @type {NavigatedViewer} */
const viewer = ref(null)
const canvasRef = ref(null)

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

  // change lane rect color
  const laneIds = [ 
    'Lane_Client_Role', 'Lane_Leader_Role', 'Lane_Executor_Role', 'Lane_Blue_Collar_Role',
  ]
  laneIds.forEach((laneId) => {
    bpmnCanvas.addMarker(laneId, 'lane-visual')
  })
  

  CANCEL_FLOW_IDS.forEach((id) => {
    /* canceled line */
    bpmnCanvas.addMarker(id, 'cancel-request-line')
  })
  bpmnCanvas.addMarker('Flow_RoleClient_To_LeaderCancel', 'line-animation')
  bpmnCanvas.addMarker('Flow_ExecAR2_To_LeaderApproval3', 'line-animation')
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

/* lane line */
::v-deep .lane-visual .djs-visual rect {
  stroke: #D9D9D9 !important;
}

::v-deep .lane-visual .djs-visual text {
  color: #242D58 !important;
}
</style>
