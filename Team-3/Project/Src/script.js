let processes=[];let events=[];let nextPid=1001;let lastStatus=null;
const $=id=>document.getElementById(id);
function now(){return new Date().toLocaleTimeString();}
function log(msg){events.unshift(`[${now()}] ${msg}`);$('log').innerHTML=events.slice(0,40).join('<br>');$('eventCount').textContent=events.length;}
function showSection(id){document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));$(id).classList.add('active');document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.section===id));refreshAll();}
document.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click',()=>showSection(b.dataset.section)));
function createProcess(){
 const name=$('processName').value||'DemoChild', ppid=$('parentPid').value||1000;
 const p={pid:nextPid++,ppid:Number(ppid),name,status:'Created',runtime:'0s',reason:'Waiting for execution',signal:'—',exit:'—',created:Date.now()};
 processes.push(p); log(`Process ${p.pid} created (PPID ${p.ppid})`); $('createResult').innerHTML=`<b>✓ Process created</b><br>PID: ${p.pid} &nbsp; PPID: ${p.ppid} &nbsp; Task: ${$('task').value}`; refreshAll();
}
function executeProcess(){
 const pid=Number($('executePid').value),p=processes.find(x=>x.pid===pid);if(!p)return alert('Create a process first.');
 p.status='Running';p.reason='Executing task';log(`Process ${p.pid} execution started`);
 let progress=0;const total=Number($('duration').value)*10;
 const timer=setInterval(()=>{progress++;$('progressBar').style.width=(progress/total*100)+'%';$('progressText').textContent=Math.round(progress/total*100)+'%';if(progress>=total){clearInterval(timer);p.status='Completed';p.exit='0';p.reason='Task completed successfully';p.runtime=$('duration').value+'s';log(`Process ${p.pid} completed normally`);refreshAll()}},100);
 refreshAll();
}
function target(){return processes.find(p=>p.status==='Running')||processes.find(p=>p.status==='Created')||processes[processes.length-1]}
function terminate(type,signal='—',exit='1',reason=''){
 const p=target();if(!p)return alert('Create a process first.');p.status='Terminated';p.signal=signal;p.exit=exit;p.reason=reason;p.runtime=p.runtime==='0s'?'—':p.runtime;
 lastStatus=p;log(`Process ${p.pid} terminated: ${reason}`);
 let cls=type==='normal'?'success':type==='signal'||type==='error'?'error':'warning';
 $('latestMessage').className='message-box '+cls;$('latestMessage').textContent=reason;
 refreshAll();
}
function normalTerminate(){terminate('normal','—','0','Process completed successfully.')}
function errorTerminate(){terminate('error','—','1','Process terminated due to an execution error.')}
function userTerminate(){terminate('user','SIGINT','130','Process terminated by user action (SIGINT).')}
function signalTerminate(){terminate('signal','SIGTERM','143','Process terminated by signal SIGTERM.')}
function sendSignal(){const sig=$('signalType').value;const p=processes.find(x=>x.pid===Number($('signalPid').value));if(!p)return alert('Select a process.');p.status='Terminated';p.signal=sig;p.exit=sig==='SIGKILL'?'137':'143';p.reason=`Process terminated by ${sig}.`;lastStatus=p;log(`Signal ${sig} sent to PID ${p.pid}`);refreshAll()}
function runTest(type){if(type==='Normal completion')normalTerminate();else if(type==='Execution error')errorTerminate();else if(type==='User termination')userTerminate();else signalTerminate();$('testResult').innerHTML=`<b>Test completed:</b> ${type}. Check the Status and Messages sections for the result.`}
function clearLogs(){events=[];$('log').innerHTML='';$('eventCount').textContent=0}
function refreshTable(){
 $('processTable').innerHTML=processes.map(p=>`<tr><td>${p.pid}</td><td>${p.ppid}</td><td class="${p.status==='Running'?'status-running':p.status==='Completed'?'status-completed':'status-terminated'}">${p.status}</td><td>${p.signal}</td><td>${p.exit}</td></tr>`).join('')||'<tr><td colspan="5">No processes created.</td></tr>';
}
function refreshSelects(){
 const opts=processes.map(p=>`<option value="${p.pid}">${p.pid} — ${p.name} (${p.status})</option>`).join('');
 $('executePid').innerHTML=opts||'<option>No process</option>'; $('signalPid').innerHTML=opts||'<option>No process</option>';
}
function refreshMonitor(){
 $('monitorTable').innerHTML=processes.map(p=>`<tr><td>${p.pid}</td><td>${p.ppid}</td><td>${p.name}</td><td class="${p.status==='Running'?'status-running':p.status==='Completed'?'status-completed':'status-terminated'}">${p.status}</td><td>${p.runtime}</td><td>${p.reason}</td></tr>`).join('')||'<tr><td colspan="6">No processes available.</td></tr>';
}
function refreshStatus(){
 const p=lastStatus||processes[processes.length-1];
 $('statusDetail').innerHTML=p?`<div class="panel"><div class="detail-row"><b>PID</b><span>${p.pid}</span></div><div class="detail-row"><b>PPID</b><span>${p.ppid}</span></div><div class="detail-row"><b>Status</b><span>${p.status}</span></div><div class="detail-row"><b>Exit Code</b><span>${p.exit}</span></div><div class="detail-row"><b>Signal</b><span>${p.signal}</span></div><div class="detail-row"><b>Reason</b><span>${p.reason}</span></div></div>`:'<div class="panel">No termination status available yet.</div>';
}
function refreshMessages(){
 const msgs=processes.filter(p=>p.status==='Terminated'||p.status==='Completed').map(p=>`<div class="message-item"><strong>PID ${p.pid}: ${p.reason}</strong><small>Exit: ${p.exit} &nbsp; Signal: ${p.signal}</small></div>`).join('');
 $('messageList').innerHTML=msgs||'<div class="message-item">No termination messages yet.</div>';
}
function refreshAll(){
 refreshTable();refreshSelects();refreshMonitor();refreshStatus();refreshMessages();
 $('activeCount').textContent=processes.filter(p=>p.status==='Running'||p.status==='Created').length;
 $('normalCount').textContent=processes.filter(p=>p.status==='Completed'||(p.status==='Terminated'&&p.exit==='0')).length;
 $('abnormalCount').textContent=processes.filter(p=>p.status==='Terminated'&&p.exit!=='0').length;
}
log('System initialized — ready to monitor processes');
refreshAll();