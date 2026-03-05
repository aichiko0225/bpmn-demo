import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer'
import { append as svgAppend, attr as svgAttr, create as svgCreate } from 'tiny-svg'
import { is } from 'bpmn-js/lib/util/ModelUtil'

/// Whole vehicle task status options
export const WHOLE_VEHICLE_TASK_STATUS = Object.freeze({
  /// Draft
  DRAFT: 'Draft',
  /// Unassigned
  UNASSIGNED: 'UnAssigned',
  /// Assigned
  ASSIGNED: 'Assigned',
  /// Approved
  APPROVED: 'Approved',
  /// Confirmed
  CONFIRMED: 'Confirmed',
  /// Reject pending 1 拒单待审批-执行人第一次确认时拒绝
  REJECT_PENDING_1: 'RejectPending1',
  /// Reject pending 2 拒单待审批-零件登记时拒绝
  REJECT_PENDING_2: 'RejectPending2',
  /// Part registered
  PART_REGISTERED: 'PartRegistered',
  /// Measured 测量完成-执行人完成测量工作（3个测量状态均为Done）
  MEASURED: 'Measured',
  /// Completed
  COMPLETED: 'Completed',
  /// Rejected
  REJECTED: 'Rejected',
  /// Cancel pending
  CANCEL_PENDING: 'CancelPending',
  /// Canceled
  CANCELED: 'Canceled',
  /// Closed
  CLOSED: 'Closed',
})

const ROLE_NODE_PREFIX = 'Role_'

class RoleRenderer extends BaseRenderer {
  constructor(eventBus, bpmnRenderer, textRenderer) {
    super(eventBus, 2000)
    this.bpmnRenderer = bpmnRenderer
    this.textRenderer = textRenderer
  }

  canRender(element) {
    return is(element, 'bpmn:Task')
      && element.businessObject
      && element.businessObject.id
      && element.businessObject.id.startsWith(ROLE_NODE_PREFIX)
  }

  drawShape(parentNode, element) {
    const width = element.width
    const height = element.height
    const roleId = element.businessObject.id
    const roleType = roleId.replace(ROLE_NODE_PREFIX, '')
    const roleColors = {
      Client: '#2f80ed',
      Executor: '#6c5ce7',
      Leader: '#f39c12',
      Blue_Collar: '#00b894',
    }
    const roleColor = roleColors[roleType] || '#5f6368'
    const group = svgCreate('g')
    svgAttr(group, {
      class: `role-node role-${roleType.toLowerCase()}`,
    })
    svgAppend(parentNode, group)
    const rect = svgCreate('rect')
    svgAttr(rect, {
      x: 0,
      y: 0,
      width,
      height,
      rx: 8,
      ry: 8,
      stroke: '#5f6368',
      strokeWidth: 1.5,
      fill: '#f5f6f7',
      class: `role-node role-${roleType.toLowerCase()}-frame`,
    })
    svgAppend(group, rect)
    const iconGroup = svgCreate('g')
    svgAppend(group, iconGroup)
    const iconCenterX = width / 2
    const iconCenterY = height / 2 + 4
    const iconStroke = roleColor
    const head = svgCreate('circle')
    svgAttr(head, {
      cx: iconCenterX,
      cy: iconCenterY - 12,
      r: 8,
      stroke: iconStroke,
      strokeWidth: 2,
      fill: 'none',
    })
    svgAppend(iconGroup, head)
    const body = svgCreate('path')
    svgAttr(body, {
      d: `M ${iconCenterX - 12} ${iconCenterY + 2} Q ${iconCenterX} ${iconCenterY - 4} ${iconCenterX + 12} ${iconCenterY + 2} L ${iconCenterX + 8} ${iconCenterY + 18} Q ${iconCenterX} ${iconCenterY + 22} ${iconCenterX - 8} ${iconCenterY + 18} Z`,
      stroke: iconStroke,
      strokeWidth: 2,
      fill: 'none',
      strokeLinejoin: 'round',
    })
    svgAppend(iconGroup, body)

    const label = this.textRenderer.createText(element.businessObject.name || '', {
      box: element,
      align: 'center-bottom',
      padding: 5,
    })
    svgAppend(group, label)
    return group
  }

  getShapePath(shape) {
    return this.bpmnRenderer.getShapePath(shape)
  }
}

RoleRenderer.$inject = ['eventBus', 'bpmnRenderer', 'textRenderer']

export const roleRendererModule = {
  __init__: ['roleRenderer'],
  roleRenderer: ['type', RoleRenderer],
}

export const CANCEL_FLOW_IDS = [
  'Flow_RoleClient_To_LeaderCancel',
  'Flow_RoleExecutor_To_LeaderCancel',
  'Flow_RoleLeader_To_LeaderCancel',
]

export const CANCEL_LABEL_IDS = [
  'Flow_RoleClient_To_LeaderCancel_label',
  'Flow_RoleExecutor_To_LeaderCancel_label',
  'Flow_RoleLeader_To_LeaderCancel_label',
]

export const FLOW_MARKERS_BY_STATUS = {
  [WHOLE_VEHICLE_TASK_STATUS.DRAFT]: ['Flow_Start_To_Apply'],
  [WHOLE_VEHICLE_TASK_STATUS.UNASSIGNED]: [
    'Flow_Start_To_Apply',
    'Flow_Apply_To_ClientApproval1',
  ],
  [WHOLE_VEHICLE_TASK_STATUS.ASSIGNED]: [
    'Flow_Apply_To_ClientApproval1',
    'Flow_LeaderApproval1_To_Assign',
    
    'Flow_Apply_To_ClientApproval2',
  ],
  [WHOLE_VEHICLE_TASK_STATUS.APPROVED]: [
    'Flow_ExecAR1_To_Register',
  ],
  [WHOLE_VEHICLE_TASK_STATUS.CONFIRMED]: [
    'Flow_ExecAR2_To_Analysis',
  ],
  [WHOLE_VEHICLE_TASK_STATUS.REJECT_PENDING_1]: [
    'Flow_ExecAR1_To_LeaderApproval2',
  ],
  [WHOLE_VEHICLE_TASK_STATUS.REJECT_PENDING_2]: [
    'Flow_ExecAR2_To_LeaderApproval3',
  ],
  [WHOLE_VEHICLE_TASK_STATUS.PART_REGISTERED]: [
    'Flow_Register_To_ExecAR2',
  ],
  [WHOLE_VEHICLE_TASK_STATUS.MEASURED]: [
    'Flow_ExecAR2_To_Analysis',
    'Flow_Analysis_To_Evaluation',
  ],
  [WHOLE_VEHICLE_TASK_STATUS.COMPLETED]: [
    'Flow_ExecAR2_To_Analysis',
    'Flow_Analysis_To_Evaluation',
    'Flow_Evaluation_To_End',
  ],
  [WHOLE_VEHICLE_TASK_STATUS.REJECTED]: [
    'Flow_LeaderApproval1_To_Apply',
    'Flow_LeaderApproval2_To_Apply',
    'Flow_LeaderApproval3_To_Apply',
  ],
  [WHOLE_VEHICLE_TASK_STATUS.CANCEL_PENDING]: [
    'Flow_RoleClient_To_LeaderCancel',
    'Flow_RoleExecutor_To_LeaderCancel',
    'Flow_RoleLeader_To_LeaderCancel',
  ],
  [WHOLE_VEHICLE_TASK_STATUS.CANCELED]: [
    'Flow_RoleClient_To_LeaderCancel',
    'Flow_RoleExecutor_To_LeaderCancel',
    'Flow_RoleLeader_To_LeaderCancel',
  ],
  [WHOLE_VEHICLE_TASK_STATUS.CLOSED]: [
    'Flow_Evaluation_To_End',
  ],
}

export const buildMockRecord = () => ({
  status: WHOLE_VEHICLE_TASK_STATUS.ASSIGNED,
  history: [
    {
      id: 'h1',
      taskId: 't1',
      fromStatus: WHOLE_VEHICLE_TASK_STATUS.DRAFT,
      toStatus: WHOLE_VEHICLE_TASK_STATUS.UNASSIGNED,
      changedBy: 'Client',
      remark: 'Client created Draft -> UnAssigned',
      ts: '2025-01-01T10:00:00Z',
    },
    {
      id: 'h2',
      taskId: 't1',
      fromStatus: WHOLE_VEHICLE_TASK_STATUS.UNASSIGNED,
      toStatus: WHOLE_VEHICLE_TASK_STATUS.ASSIGNED,
      changedBy: 'Leader',
      remark: 'Leader assigned executor',
      ts: '2025-01-01T12:00:00Z',
    },
  ],
})

export const ROADMAP_XML = `
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  id="Definitions_WholeVehicle_Roadmap"
  targetNamespace="http://bpmn.io/schema/bpmn">
  
  <bpmn:process id="Process_WholeVehicle_Roadmap" isExecutable="false">
    <bpmn:laneSet id="LaneSet_Roadmap">
      <bpmn:lane id="Lane_Client_Role" name="Client">
        <bpmn:flowNodeRef>StartEvent_Start</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Activity_Apply_Application</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Activity_Satisfaction_Evaluation</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>EndEvent_End</bpmn:flowNodeRef>
        
      </bpmn:lane>
      <bpmn:lane id="Lane_Leader_Role" name="Leader">
        <bpmn:flowNodeRef>Gateway_Leader_Approval_1</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_Leader_Approval_2</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_Leader_Approval_3</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Executor_Role" name="Executor">
        <bpmn:flowNodeRef>Activity_Analysis_And_Measure</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_Executor_Accept_Reject_1</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_Executor_Accept_Reject_2</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Blue_Collar_Role" name="Blue Collar">
        <bpmn:flowNodeRef>Activity_Register_Blue_Collar</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <bpmn:startEvent id="StartEvent_Start" name="Start">
      <bpmn:outgoing>Flow_Start_To_Apply</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:userTask id="Activity_Apply_Application" name="apply application">
      <bpmn:incoming>Flow_Start_To_Apply</bpmn:incoming>
      <bpmn:incoming>Flow_LeaderApproval1_To_Apply</bpmn:incoming>
      <bpmn:incoming>Flow_LeaderApproval2_To_Apply</bpmn:incoming>
      <bpmn:incoming>Flow_LeaderApproval3_To_Apply</bpmn:incoming>
      <bpmn:outgoing>Flow_Apply_To_ClientApproval1</bpmn:outgoing>
      <bpmn:outgoing>Flow_Apply_To_ClientApproval2</bpmn:outgoing>
    </bpmn:userTask>

    <bpmn:exclusiveGateway id="Gateway_Leader_Approval_1" name="Approval">
      <bpmn:incoming>Flow_Apply_To_ClientApproval1</bpmn:incoming>
      <bpmn:outgoing>Flow_LeaderApproval1_To_Assign</bpmn:outgoing>
      <bpmn:outgoing>Flow_LeaderApproval1_To_Apply</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:exclusiveGateway id="Gateway_Leader_Approval_2" name="Approval">
      <bpmn:incoming>Flow_ExecAR1_To_LeaderApproval2</bpmn:incoming>
      <bpmn:outgoing>Flow_LeaderApproval2_To_Apply</bpmn:outgoing>
      <bpmn:outgoing>Flow_LeaderApproval2_To_ExecAR1</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:exclusiveGateway id="Gateway_Leader_Approval_3" name="Approval">
      <bpmn:incoming>Flow_ExecAR2_To_LeaderApproval3</bpmn:incoming>
      <bpmn:outgoing>Flow_LeaderApproval3_To_Apply</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:exclusiveGateway id="Gateway_Executor_Accept_Reject_1" name="Approval">
      <bpmn:incoming>Flow_Apply_To_ClientApproval2</bpmn:incoming>
      <bpmn:incoming>Flow_LeaderApproval2_To_ExecAR1</bpmn:incoming>
      <bpmn:outgoing>Flow_ExecAR1_To_Register</bpmn:outgoing>
      <bpmn:outgoing>Flow_ExecAR1_To_LeaderApproval2</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:exclusiveGateway id="Gateway_Executor_Accept_Reject_2" name="Approval">
      <bpmn:incoming>Flow_Register_To_ExecAR2</bpmn:incoming>
      <bpmn:outgoing>Flow_ExecAR2_To_LeaderApproval3</bpmn:outgoing>
      <bpmn:outgoing>Flow_ExecAR2_To_Analysis</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:userTask id="Activity_Analysis_And_Measure" name="analysis and measure">
      <bpmn:incoming>Flow_ExecAR2_To_Analysis</bpmn:incoming>
      <bpmn:outgoing>Flow_Analysis_To_Evaluation</bpmn:outgoing>
    </bpmn:userTask>
    <bpmn:userTask id="Activity_Register_Blue_Collar" name="register">
      <bpmn:incoming>Flow_ExecAR1_To_Register</bpmn:incoming>
      <bpmn:outgoing>Flow_Register_To_ExecAR2</bpmn:outgoing>
    </bpmn:userTask>

    <bpmn:userTask id="Activity_Satisfaction_Evaluation" name="satisfaction evaluation">
      <bpmn:incoming>Flow_Analysis_To_Evaluation</bpmn:incoming>
      <bpmn:outgoing>Flow_Evaluation_To_End</bpmn:outgoing>
    </bpmn:userTask>

    <bpmn:task id="Role_Client" name="Client">
      <bpmn:outgoing>Flow_RoleClient_To_LeaderCancel</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Role_Leader" name="Leader">
      <bpmn:incoming>Flow_RoleClient_To_LeaderCancel</bpmn:incoming>
      <bpmn:incoming>Flow_RoleExecutor_To_LeaderCancel</bpmn:incoming>
      <bpmn:outgoing>Flow_RoleLeader_To_LeaderCancel</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Role_Executor" name="Executor">
      <bpmn:outgoing>Flow_RoleExecutor_To_LeaderCancel</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Role_Blue_Collar" name="Blue Collar" />
    <bpmn:startEvent id="EndEvent_End" name="End">
      <bpmn:incoming>Flow_Evaluation_To_End</bpmn:incoming>
    </bpmn:startEvent>

    <bpmn:sequenceFlow id="Flow_Start_To_Apply" 
    sourceRef="StartEvent_Start" 
    targetRef="Activity_Apply_Application" />

    <bpmn:sequenceFlow id="Flow_Apply_To_ClientApproval1" 
    sourceRef="Activity_Apply_Application" 
    targetRef="Gateway_Leader_Approval_1" />
    <bpmn:sequenceFlow id="Flow_Apply_To_ClientApproval2" 
    sourceRef="Activity_Apply_Application" 
    targetRef="Gateway_Executor_Accept_Reject_1" />

    <bpmn:sequenceFlow id="Flow_LeaderApproval1_To_Assign" name="approve and assign executor" 
    sourceRef="Gateway_Leader_Approval_1" 
    targetRef="Gateway_Executor_Accept_Reject_1" />

    <bpmn:sequenceFlow id="Flow_ExecAR1_To_Register" name="accept" 
    sourceRef="Gateway_Executor_Accept_Reject_1" 
    targetRef="Activity_Register_Blue_Collar" />

    <bpmn:sequenceFlow id="Flow_ExecAR1_To_LeaderApproval2" name="reject" 
    sourceRef="Gateway_Executor_Accept_Reject_1" 
    targetRef="Gateway_Leader_Approval_2" />

    <bpmn:sequenceFlow id="Flow_Register_To_ExecAR2" 
    sourceRef="Activity_Register_Blue_Collar" 
    targetRef="Gateway_Executor_Accept_Reject_2" />

    <bpmn:sequenceFlow id="Flow_ExecAR2_To_LeaderApproval3" name="reject" 
    sourceRef="Gateway_Executor_Accept_Reject_2"
    targetRef="Gateway_Leader_Approval_3" />

    <bpmn:sequenceFlow id="Flow_LeaderApproval1_To_Apply" name="reject" 
    sourceRef="Gateway_Leader_Approval_1" 
    targetRef="Activity_Apply_Application" />
    <bpmn:sequenceFlow id="Flow_LeaderApproval2_To_Apply" name="approve" 
    sourceRef="Gateway_Leader_Approval_2" 
    targetRef="Activity_Apply_Application" />
    <bpmn:sequenceFlow id="Flow_LeaderApproval3_To_Apply" name="approve" 
    sourceRef="Gateway_Leader_Approval_3" 
    targetRef="Activity_Apply_Application" />
    <bpmn:sequenceFlow id="Flow_LeaderApproval4_To_Analysis" name="reject" 
    sourceRef="Gateway_Leader_Approval_3" 
    targetRef="Activity_Analysis_And_Measure" />

    <bpmn:sequenceFlow id="Flow_LeaderApproval2_To_ExecAR1" name="reject" 
    sourceRef="Gateway_Leader_Approval_2" 
    targetRef="Gateway_Executor_Accept_Reject_1" />

    <bpmn:sequenceFlow id="Flow_ExecAR2_To_Analysis" name="accept" 
    sourceRef="Gateway_Executor_Accept_Reject_2" 
    targetRef="Activity_Analysis_And_Measure" />

    <bpmn:sequenceFlow id="Flow_Analysis_To_Evaluation" 
    sourceRef="Activity_Analysis_And_Measure" 
    targetRef="Activity_Satisfaction_Evaluation" />

    <bpmn:sequenceFlow id="Flow_Evaluation_To_End" 
    sourceRef="Activity_Satisfaction_Evaluation" 
    targetRef="EndEvent_End" />


    <bpmn:sequenceFlow id="Flow_RoleClient_To_LeaderCancel" name="cancel"
    sourceRef="Role_Client" 
    targetRef="Role_Leader" />
    <bpmn:sequenceFlow id="Flow_RoleExecutor_To_LeaderCancel" name="cancel"
    color="#FF0000"
    sourceRef="Role_Executor" 
    targetRef="Role_Leader" />
    <bpmn:sequenceFlow id="Flow_RoleLeader_To_LeaderCancel" name="cancel"
    sourceRef="Role_Leader" 
    targetRef="Role_Leader" />

  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_WholeVehicle_Roadmap">
    <bpmndi:BPMNPlane id="BPMNPlane_WholeVehicle_Roadmap" bpmnElement="Process_WholeVehicle_Roadmap">
      <!-- role lane -->
      <bpmndi:BPMNShape id="Lane_Client_Role_Diagram" bpmnElement="Lane_Client_Role" isHorizontal="true">
        <dc:Bounds x="220" y="120" width="1440" height="240" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Leader_Role_Diagram" bpmnElement="Lane_Leader_Role" isHorizontal="true">
        <dc:Bounds x="220" y="360" width="1440" height="240" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Executor_Role_Diagram" bpmnElement="Lane_Executor_Role" isHorizontal="true">
        <dc:Bounds x="220" y="600" width="1440" height="240" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Blue_Collar_Role_Diagram" bpmnElement="Lane_Blue_Collar_Role" isHorizontal="true">
        <dc:Bounds x="220" y="840" width="1440" height="240" />
      </bpmndi:BPMNShape>

      <!-- client -->
      <bpmndi:BPMNShape id="StartEvent_Start_Diagram" bpmnElement="StartEvent_Start">
        <dc:Bounds x="396" y="140" width="48" height="48" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Activity_Apply_Application_Diagram" bpmnElement="Activity_Apply_Application">
        <dc:Bounds x="460" y="240" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Activity_Satisfaction_Evaluation_Diagram" bpmnElement="Activity_Satisfaction_Evaluation">
        <dc:Bounds x="1340" y="200" width="140" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_End_Diagram" bpmnElement="EndEvent_End">
        <dc:Bounds x="1520" y="216" width="48" height="48" />
      </bpmndi:BPMNShape>

      <!-- gateway approval -->
      <bpmndi:BPMNShape id="Gateway_Leader_Approval_1_Diagram" bpmnElement="Gateway_Leader_Approval_1" isMarkerVisible="true">
        <dc:Bounds x="340" y="400" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_Leader_Approval_2_Diagram" bpmnElement="Gateway_Leader_Approval_2" isMarkerVisible="true">
        <dc:Bounds x="900" y="400" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_Leader_Approval_3_Diagram" bpmnElement="Gateway_Leader_Approval_3" isMarkerVisible="true">
        <dc:Bounds x="1060" y="400" width="50" height="50" />
      </bpmndi:BPMNShape>
      
      <!-- executor -->
      <bpmndi:BPMNShape id="Activity_Analysis_And_Measure_Diagram" bpmnElement="Activity_Analysis_And_Measure">
        <dc:Bounds x="1180" y="680" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_Executor_Accept_Reject_1_Diagram" bpmnElement="Gateway_Executor_Accept_Reject_1" isMarkerVisible="true">
        <dc:Bounds x="460" y="650" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_Executor_Accept_Reject_2_Diagram" bpmnElement="Gateway_Executor_Accept_Reject_2" isMarkerVisible="true">
        <dc:Bounds x="1060" y="695" width="50" height="50" />
      </bpmndi:BPMNShape>
      
      <!-- blue collar -->
      <bpmndi:BPMNShape id="Activity_Register_Blue_Collar_Diagram" bpmnElement="Activity_Register_Blue_Collar">
        <dc:Bounds x="440" y="920" width="120" height="80" />
      </bpmndi:BPMNShape>

      <!-- Role Custom Render -->
      <bpmndi:BPMNShape id="Role_Client_Diagram" bpmnElement="Role_Client">
        <dc:Bounds x="100" y="200" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Role_Leader_Diagram" bpmnElement="Role_Leader">
        <dc:Bounds x="100" y="440" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Role_Executor_Diagram" bpmnElement="Role_Executor">
        <dc:Bounds x="100" y="680" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Role_Blue_Collar_Diagram" bpmnElement="Role_Blue_Collar">
        <dc:Bounds x="100" y="920" width="100" height="80" />
      </bpmndi:BPMNShape>
      

      <bpmndi:BPMNEdge id="Flow_Start_To_Apply_Diagram" bpmnElement="Flow_Start_To_Apply">
        <di:waypoint x="444" y="164" />
        <di:waypoint x="520" y="164" />
        <di:waypoint x="520" y="240" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Apply_To_ClientApproval1_Diagram" bpmnElement="Flow_Apply_To_ClientApproval1">
        <di:waypoint x="520" y="320" />
        <di:waypoint x="520" y="340" />
        <di:waypoint x="365" y="340" />
        <di:waypoint x="365" y="400" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Apply_To_ClientApproval2_Diagram" bpmnElement="Flow_Apply_To_ClientApproval2">
        <di:waypoint x="520" y="320" />
        <di:waypoint x="520" y="340" />
        <di:waypoint x="620" y="340" />
        <di:waypoint x="620" y="620" />
        <di:waypoint x="485" y="620" />
        <di:waypoint x="485" y="650" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_LeaderApproval1_To_Assign_Diagram" bpmnElement="Flow_LeaderApproval1_To_Assign">
        <di:waypoint x="389" y="424" />
        <di:waypoint x="485" y="424" />
        <di:waypoint x="485" y="480" />
        <di:waypoint x="485" y="650" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_LeaderApproval1_To_Apply_Diagram" bpmnElement="Flow_LeaderApproval1_To_Apply">
        <di:waypoint x="340" y="425" />
        <di:waypoint x="280" y="425" />
        <di:waypoint x="280" y="280" />
        <di:waypoint x="460" y="280" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_LeaderApproval3_To_Apply_Diagram" bpmnElement="Flow_LeaderApproval3_To_Apply">
        <di:waypoint x="1084" y="400" />
        <di:waypoint x="1084" y="280" />
        <di:waypoint x="580" y="280" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_LeaderApproval2_To_Apply_Diagram" bpmnElement="Flow_LeaderApproval2_To_Apply">
        <di:waypoint x="925" y="400" />
        <di:waypoint x="925" y="280" />
        <di:waypoint x="580" y="280" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_LeaderApproval2_To_ExecAR1_Diagram" bpmnElement="Flow_LeaderApproval2_To_ExecAR1">
        <di:waypoint x="925" y="448" />
        <di:waypoint x="925" y="720" />
        <di:waypoint x="485" y="720" />
        <di:waypoint x="485" y="700" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_LeaderApproval4_To_Analysis_Diagram" bpmnElement="Flow_LeaderApproval4_To_Analysis">
        <di:waypoint x="1108" y="424" />
        <di:waypoint x="1238" y="424" />
        <di:waypoint x="1238" y="680" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_ExecAR1_To_Register_Diagram" bpmnElement="Flow_ExecAR1_To_Register">
        <di:waypoint x="460" y="675" />
        <di:waypoint x="400" y="675" />
        <di:waypoint x="400" y="960" />
        <di:waypoint x="440" y="960" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_ExecAR1_To_LeaderApproval2_Diagram" bpmnElement="Flow_ExecAR1_To_LeaderApproval2">
        <di:waypoint x="510" y="675" />
        <di:waypoint x="710" y="675" />
        <di:waypoint x="710" y="424" />
        <di:waypoint x="900" y="424" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Register_To_ExecAR2_Diagram" bpmnElement="Flow_Register_To_ExecAR2">
        <di:waypoint x="560" y="960" />
        <di:waypoint x="800" y="960" />
        <di:waypoint x="800" y="720" />
        <di:waypoint x="1060" y="720" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_ExecAR2_To_LeaderApproval3_Diagram" bpmnElement="Flow_ExecAR2_To_LeaderApproval3">
        <di:waypoint x="1085" y="695" />
        <di:waypoint x="1085" y="450" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_ExecAR2_To_Analysis_Diagram" bpmnElement="Flow_ExecAR2_To_Analysis">
        <di:waypoint x="1110" y="720" />
        <di:waypoint x="1180" y="720" />
      </bpmndi:BPMNEdge>  
      <bpmndi:BPMNEdge id="Flow_Analysis_To_Evaluation_Diagram" bpmnElement="Flow_Analysis_To_Evaluation">
        <di:waypoint x="1300" y="720" />
        <di:waypoint x="1400" y="720" />
        <di:waypoint x="1400" y="280" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Evaluation_To_End_Diagram" bpmnElement="Flow_Evaluation_To_End">
        <di:waypoint x="1480" y="240" />
        <di:waypoint x="1520" y="240" />
      </bpmndi:BPMNEdge>

      <!-- cancel flow -->
      <bpmndi:BPMNEdge id="Flow_RoleClient_To_LeaderCancel_Diagram" bpmnElement="Flow_RoleClient_To_LeaderCancel">
        <di:waypoint x="100" y="240" />
        <di:waypoint x="20" y="240" />
        <di:waypoint x="20" y="480" />
        <di:waypoint x="100" y="480" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_RoleExecutor_To_LeaderCancel_Diagram" bpmnElement="Flow_RoleExecutor_To_LeaderCancel">
        <di:waypoint x="100" y="720" />
        <di:waypoint x="20" y="720" />
        <di:waypoint x="20" y="480" />
        <di:waypoint x="100" y="480" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_RoleLeader_To_LeaderCancel_Diagram" bpmnElement="Flow_RoleLeader_To_LeaderCancel">
        <di:waypoint x="150" y="520" />
        <di:waypoint x="150" y="560" />
        <di:waypoint x="60" y="560" />
        <di:waypoint x="60" y="480" />
        <di:waypoint x="100" y="480" />
      </bpmndi:BPMNEdge>

    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>
`
