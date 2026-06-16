import React, { useState, useCallback, useEffect,useRef, memo } from "react";
import  {ReactFlow,
  MiniMap,
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import WorkflowStep from "../../components/Workflow/WorkflowStep";
import NewWorkflowStep from "../../components/Workflow/NewWorkflowStep";

// Custom Node Component
const TopToBottomNode = memo(({ data }) => (
    <div style={{ minWidth: '480px',zIndex: 2}}>
<Handle style={{visibility: 'hidden',left: "25%", top: "80%", right: "auto", bottom: "auto", transform: "translate(-25%, -50%)"}} 
type="source"
        position={Position.Bottom}/>
      <WorkflowStep stepRef={data.step_ref_id} stepAction={data.stepAction} stepStatus={data.stepStatus} fileName={data.file_name} fileUrl={data.file_url} handleExpansion={data.handleExpansion} handleRefresh={data.handleRefresh}  dueDate={data.dueDate} isFileRequired={data.isFileRequired=='1'} stepNumber={data.id} stepTitle={data.title} role={data.role}/>
      <Handle style={{visibility: 'hidden',left: "25%", top: "20%", right: "auto", bottom: "auto", transform: "translate(-25%, -20%)"}} 
      type="target"
        position={Position.Top}/>
    </div>
  ));

  const BottomToTopNode = memo(({ data }) => (
    <div style={{ minWidth: '480px',zIndex: 2}}>
<Handle style={{visibility: 'hidden',left: "25%", top: "20%", right: "auto", bottom: "auto", transform: "translate(-25%, -20%)"}} 
type="source"
        position={Position.Top}/>
      <WorkflowStep stepRef={data.step_ref_id} stepAction={data.stepAction} stepStatus={data.stepStatus} fileName={data.file_name} fileUrl={data.file_url} handleExpansion={data.handleExpansion} handleRefresh={data.handleRefresh} dueDate={data.dueDate} isFileRequired={data.isFileRequired=='1'} stepNumber={data.id} stepTitle={data.title} role={data.role}/>
      <Handle style={{visibility: 'hidden',left: "25%", top: "95%", right: "auto", bottom: "auto", transform: "translate(-25%, -95%)"}} 
      type="target"
        position={Position.Bottom}/>
    </div>
  ));



const BottomSourceNode = memo(({data}) =>{
    return (
        <div style={{ minWidth: '480px',zIndex: 1, minWidth: '480px'}}>
            <Handle style={{visibility: 'hidden',left: "90%", top: "50%", right: "auto", bottom: "auto", transform: "translate(-25%, -50%)"}} 
            type="source"
            position={Position.Right}/>
            <WorkflowStep stepRef={data.step_ref_id} stepAction={data.stepAction} stepStatus={data.stepStatus} fileName={data.file_name} fileUrl={data.file_url} handleExpansion={data.handleExpansion} handleRefresh={data.handleRefresh} dueDate={data.dueDate} isFileRequired={data.isFileRequired=='1'}  stepNumber={data.id} stepTitle={data.title} role={data.role}/>
            <Handle style={{visibility: 'hidden',left: "25%", top: "20%", right: "auto", bottom: "auto", transform: "translate(-25%, -20%)"}} 
            type="target"
            position={Position.Top}/>
        </div>
    )
});

const BottomTargetNode = memo(({data}) =>(
    <div style={{ minWidth: '480px',zIndex: 1}}>
        <Handle style={{visibility: 'hidden',left: "25%", top: "20%", right: "auto", bottom: "auto", transform: "translate(-25%, -20%)"}} 
        type="source"
        position={Position.Top} />
        <WorkflowStep stepRef={data.step_ref_id} stepAction={data.stepAction} stepStatus={data.stepStatus} fileName={data.file_name} fileUrl={data.file_url} handleExpansion={data.handleExpansion} handleRefresh={data.handleRefresh} dueDate={data.dueDate} isFileRequired={data.isFileRequired=='1'}  stepNumber={data.id} stepTitle={data.title} role={data.role}/>
        <Handle style={{visibility: 'hidden',left: "1%", top: "50%", right: "auto", bottom: "auto", transform: "translate(-25%, -50%)"}} 
        type="target"
        position={Position.Left}/>
    </div>
));

const TopSourceNode = memo(({data}) =>(
    <div style={{ minWidth: '480px',zIndex: 3}}>
        <Handle style={{visibility: 'hidden',left: "90%", top: "50%", right: "auto", bottom: "auto", transform: "translate(-25%, -50%)"}} 
        type="source"
        position={Position.Right}/>
        <WorkflowStep stepRef={data.step_ref_id} stepAction={data.stepAction} stepStatus={data.stepStatus} fileName={data.file_name} fileUrl={data.file_url} handleExpansion={data.handleExpansion} handleRefresh={data.handleRefresh} dueDate={data.dueDate} isFileRequired={data.isFileRequired=='1'}  stepNumber={data.id} stepTitle={data.title} role={data.role}/>
        <Handle style={{visibility: 'hidden',left: "25%", top: "95%", right: "auto", bottom: "auto", transform: "translate(-25%, -95%)"}} 
        type="target"
        position={Position.Bottom}/>
    </div>
));

const TopTargetNode = memo(({data}) =>(
    <div style={{ minWidth: '480px',zIndex: 3}}>
        <Handle style={{visibility: 'hidden',left: "25%", top: "80%", right: "auto", bottom: "auto", transform: "translate(-25%, -50%)"}} 
        type="source"
        position={Position.Bottom}/>
        <WorkflowStep stepRef={data.step_ref_id} stepAction={data.stepAction} stepStatus={data.stepStatus} fileName={data.file_name} fileUrl={data.file_url} handleExpansion={data.handleExpansion} handleRefresh={data.handleRefresh} dueDate={data.dueDate} isFileRequired={data.isFileRequired=='1'} stepNumber={data.id} stepTitle={data.title} role={data.role}/>
        <Handle style={{visibility: 'hidden',left: "1%", top: "50%", right: "auto", bottom: "auto", transform: "translate(-25%, -50%)"}} 
        type="target"
        position={Position.Left}/>
    </div>
));

const NewNode = memo(({data}) =>(
    <div style={{ minWidth: '480px',zIndex: 10}}>
        <Handle style={{visibility: 'hidden',left: "25%", top: "80%", right: "auto", bottom: "auto", transform: "translate(-25%, -50%)"}} 
        type="source"
        position={Position.Bottom}/>
        <NewWorkflowStep stepNumber={data.id} stepTitle={data.title} role={data.role} handleDeleteNode={data.handleDeleteNode}  />
        <Handle style={{visibility: 'hidden',left: "25%", top: "50%", right: "auto", bottom: "auto", transform: "translate(-25%, -50%)"}} 
        type="target"
        position={Position.Left}/>
    </div>
));
  
const nodeTypes = { newNode: NewNode,topToBottomNode: TopToBottomNode, bottomSourceNode: BottomSourceNode,bottomTargetNode: BottomTargetNode,topSourceNode: TopSourceNode,topTargetNode: TopTargetNode, bottomToTopNode:BottomToTopNode };


const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, source, target, addNode }) => {
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  return (
    <>
      <line x1={sourceX} y1={sourceY} x2={targetX} y2={targetY} stroke="#007bff" strokeWidth="1" markerEnd="url(#arrowhead)" />
      <foreignObject x={midX - 10} y={midY - 10} width={20} height={20} onClick={()=>addNode(source,target)}>
          <AddCircleOutlineIcon sx={{height: 20, width:20, color: '#007bff', background: 'white'}}/>
      </foreignObject>
    </>
  );
};

const getPositionForNode = (index)=>{
    const col = Math.floor((index-1)/3);
    const row = Math.floor((index-1)%6);
    const rowFact = Math.floor((index-1)/6);
    switch(row){
        case 0:
            return {x: 0 + col * 540, y: row*200}
        case 1:
            return {x: 0 + col * 540, y: row*200}
        case 2:
            return {x: 0 + col * 540, y: row*200}
        case 3:
            return {x: 0 + col * 540, y: (5-row)*200}
        case 4:
            return {x: 0 + col * 540, y: (5-row)*200}
        case 5:
            return {x: 0 + col * 540, y: (5-row)*200}
    }
}

const getPositionForOpenNode = (index)=>{
    const col = Math.floor((index-1)/3);
    const row = Math.floor((index-1)%6);
    const rowFact = Math.floor((index-1)/6);
    switch(row){
        case 0:
            return {x: 0 + col * 540, y: row*200}
        case 1:
            return {x: 0 + col * 540, y: row*200 + 201}
        case 2:
            return {x: 0 + col * 540, y: row*200 + 201}
        case 3:
            return {x: 0 + col * 540, y: (5-row)*200}
        case 4:
            return {x: 0 + col * 540, y: (5-row)*200 - 201}
        case 5:
            return {x: 0 + col * 540, y: (5-row)*200 - 201}
    }
}


const getNodeType = (index) => {
    if(index==0){
        return 'topToBottomNode'
    }
    const mod = index % 6;
    switch(mod){
        case 0:
            return 'topTargetNode'
        case 1:
            return 'topToBottomNode'
        case 2:
            return 'bottomSourceNode'
        case 3:
            return 'bottomTargetNode'
        case 4:
            return 'bottomToTopNode'
        case 5:
            return 'topSourceNode'
    }
}

const FlowChart = ({data, handleRefresh, isRefresh}) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);

    const adjustHeightForColumn = 
        (index, isExpanding) => {
          setNodes((prevNodes) => {
            const col = Math.floor((index - 1) / 3);
            const row = Math.floor((index - 1) % 6);
            const upperLimit = Math.ceil(index/3)*3;
  
            const updatedNodes = prevNodes.map((node, idx) => {
              if (idx > index && idx < upperLimit) { 
                return {
                  ...node,
                  position: isExpanding ? getPositionForOpenNode(idx) : getPositionForNode(idx) ,
                };
              }
              return node;
            });
            return updatedNodes;

          });
        }
       ;
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  //   const [nodeCount, setNodeCount] = useState(5);
  const flowWrapperRef = useRef(null);

  // Capture layout screenshot without any zoom (original view)
  const handleCapture = async () => {
    if (flowWrapperRef.current) {
      const flowRenderer =
        flowWrapperRef.current.querySelector(".react-flow__viewport");
      if (flowRenderer) {
        const originalTransform = flowRenderer.style.transform;
        flowRenderer.style.transform = "scale(0.4) translate(0px, 0px)";

        flowRenderer.style.transform = originalTransform;
      }
    }
  };


  useEffect(()=>{
    const initialNodes = [];
    const initialEdges = []
    if(data && data.length){
        for(const step of data){
            initialNodes.push({
                id: step.step_number.toString(),
                data: {
                    id: step.step_number.toString(),
                    step_ref_id: step.idtbl_workflow_step_tracking,
                    title: step.step_title,
                    role: step.assignee,
                    dueDate: step.due_date,
                    stepAction: step.action,
                    file_name: step.file_name,
                    file_url: step.file_url,
                    isFileRequired: step.is_file_required,
                    stepStatus: step.step_status,
                    handleExpansion,
                    handleDeleteNode,
                    handleRefresh
                },
            })
            if(step.step_number != data.length){
              initialEdges.push({ id: `e${step.step_number}-${step.step_number +1}`, source: `${step.step_number}`, target: `${step.step_number+1}`, type: "custom" })
            }
        }
    }
    let tempNodes = initialNodes;
    setEdges(initialEdges)
    for(let i =0;i < tempNodes.length;i++){
        tempNodes[i].position = getPositionForNode(parseInt(tempNodes[i].id))
        tempNodes[i].type = getNodeType(i);
    }
    setNodes(tempNodes)
  },[data, isRefresh]);
  
  const insertAfterId = (array, sourceId, newRecord) => {
        const index = array.findIndex(item => item.id === sourceId);
        if (index === -1) {
            console.log("Target ID not found");
            return array;
        }
        newRecord.id = (parseInt(sourceId)+1).toString(); 
        array.splice(index + 1, 0, newRecord);
        return array;
    }

  const addNodeBetween = (source, target) => {
    const nodeCount = nodes.length
    const newId = `${nodeCount}`;
    const newNode = {
      id: newId,
      data: { id: target, title: "Verify", role: "Client",handleDeleteNode ,handleExpansion},
      position: getPositionForNode(parseInt(target)),
      type: 'newNode'
    };
    const temp = [...nodes];
    const updatedNodes = insertAfterId(temp, source, newNode); 
    let tempNodes = updatedNodes
    let prevVal = -1;
    let isModified = false

    const sourceIndex = parseInt(source);
    const rowDirection = Math.ceil(sourceIndex/3)%2 == 1;
    const upperLimit = rowDirection ? Math.ceil(sourceIndex/3) * 3 : Math.floor(sourceIndex/3)*3
    for(let i =0;i < updatedNodes.length;i++){
        if(prevVal == tempNodes[i].id){
            isModified = true;
        }
        if(isModified){
            tempNodes[i].id = (parseInt(tempNodes[i].id)+1).toString()
            tempNodes[i].data.id = (parseInt(tempNodes[i].data.id)+1).toString()
        }
        tempNodes[i].position = {...getPositionForNode(parseInt(tempNodes[i].id))}
        if( rowDirection && parseInt(tempNodes[i].id) > sourceIndex+1  && parseInt(tempNodes[i].id)<=upperLimit){
          tempNodes[i].position.y += 200;
        }else{
          if(!rowDirection && parseInt(tempNodes[i].id) < sourceIndex-1 && parseInt(tempNodes[i].id)>upperLimit){
            tempNodes[i].position.y -= 200;
          }
        }
        tempNodes[i].type = tempNodes[i].type== 'newNode'? tempNodes[i].type:getNodeType(i)
        prevVal = tempNodes[i].id
    }
    const finalTarget = nodeCount+1;
    setNodes(tempNodes);
    setEdges((eds) => {
        return [
            ...eds.filter(e=> e.id != `e${newId}-${finalTarget}`),
            { id: `e${newId}-${finalTarget}`, source: newId.toString(), target: finalTarget.toString(), type: "custom" },
        ];
    });
  };


const handleExpansion = (nodeIndex, isExpanding)=>{
  if(nodes.length){
    const rowDirection = (nodeIndex/3)%2==0;
  const updatedNodes= [...nodes]
  if (rowDirection) {
    let numberOfUpdatingNodes = 2 - (nodeIndex % 3);
    if (numberOfUpdatingNodes > 0) {
      nodeIndex += 1;
      while (numberOfUpdatingNodes--) {
        if(isExpanding){
          updatedNodes[nodeIndex].position.y += 75;
        }else{
          updatedNodes[nodeIndex].position.y -= 75;
        }
        nodeIndex += 1;
      }
    }
  } else {
    let numberOfUpdatingNodes = nodeIndex % 3;
    if (numberOfUpdatingNodes > 0) {
      nodeIndex -= 1;
      while (numberOfUpdatingNodes--) {
        if(isExpanding){
          updatedNodes[nodeIndex].position.y += 75;
        }else{
          updatedNodes[nodeIndex].position.y -= 75;
        }
        nodeIndex -= 1;
      }
    }
  }
  setNodes([...updatedNodes]);
  }
}

const handleDeleteNode = (index) => {
  // Update nodes state
  setNodes((prevNodes) => {
    // Guard against an invalid index.
    if (index < 0 || index >= prevNodes.length) return prevNodes;

    // Capture the removed node’s id.
    const removedNode = prevNodes[index];
    const removedNodeId = removedNode.id;

    const newNodes = [...prevNodes];
    newNodes.splice(index-1, 1);
    // After removal, update IDs and positions for all nodes after the removed one.
    for (let i = index-1; i < newNodes.length; i++) {
      // New IDs are based on the new position in the array.
      newNodes[i].id = (i+1).toString();
      newNodes[i].data.id = (i+1).toString();
      newNodes[i].position = getPositionForNode(parseInt(newNodes[i].id));
      newNodes[i].type = newNodes[i].type === 'newNode' ? newNodes[i].type : getNodeType(i);
    }
    // Capture adjacent nodes from the updated list.
    const previousNode = index-1 > 0 ? newNodes[index - 2] : null;
    const nextNode = index-1 < newNodes.length ? newNodes[index-1] : null;
  
    return newNodes;
  });
  setEdges([...edges])
};
  return (
    <div  style={{ width: "100vw%",  height: "878px", top: -1, paddingBottom: 2 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onEdgesChange={onEdgesChange}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        // panOnDrag={false}
        panOnScroll={false}
        zoomOnScroll={true}
        edgeTypes={{ custom: (props) => <CustomEdge {...props} addNode={addNodeBetween} /> }}
        fitView
        proOptions={{ hideAttribution: true }}
        key={isRefresh}
        
      >
        <Background />
        <svg width="0" height="0">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="black" />
            </marker>
          </defs>
        </svg>
      </ReactFlow>
    </div>
  );
};

export default FlowChart;
