(() => {
  const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const materialsOf = student => String(student.completed_materials || '').split('|').map(value => value.trim()).filter(Boolean);

  window.render = function renderStudentTable(){
    const container = document.getElementById('studentList');
    if(!students.length){ container.innerHTML='<div class="empty">Add your first student above.</div>'; return; }
    container.classList.add('table-wrap');
    container.innerHTML=`<table class="students-table"><thead><tr><th>Student</th><th>Email</th><th>Code</th><th>Completed materials</th><th>Lesson</th><th>Actions</th></tr></thead><tbody>${students.map(student => {
      const materials=materialsOf(student);
      const options=['Present Simple','Past Simple','BAC Writing','IELTS Writing','Topic Flashcards'].map(title=>`<option>${safe(title)}</option>`).join('');
      return `<tr id="student-row-${student.id}"><td><b class="view-value">${safe(student.name)}</b><input class="edit-value" data-field="name" value="${safe(student.name)}" hidden><span class="cell-sub">${student.active?'Active':'Paused'} · ${safe(student.last_seen_at||'Never')}</span></td><td><span class="view-value">${safe(student.email)}</span><input class="edit-value" data-field="email" type="email" value="${safe(student.email)}" hidden></td><td><span class="code view-value">${safe(student.access_code)}</span><input class="edit-value" data-field="code" value="${safe(student.access_code)}" hidden></td><td class="materials-cell"><div class="view-value">${materials.length?materials.map(item=>`<span class="material-chip">${safe(item)}</span>`).join(''):'<span class="status">No completed materials</span>'}</div><input class="edit-value edit-materials" data-field="materials" value="${safe(materials.join(', '))}" placeholder="Comma-separated materials" hidden></td><td><select class="lesson-material-select" id="lesson-${student.id}">${options}</select><button class="btn ghost" onclick="viewSelectedMaterial(${student.id})">View material</button><button class="btn" onclick="assignSelectedMaterial(${student.id})">Add workbook</button><button class="btn coral" onclick="startSelectedLesson(${student.id},'${safe(student.name)}')">Start lesson</button><span class="cell-sub" id="material-status-${student.id}"></span></td><td class="table-actions"><button class="btn ghost edit-button" onclick="editStudent(${student.id})">Edit</button><button class="btn save-button" onclick="saveStudent(${student.id})" hidden>Save</button></td></tr>`;
    }).join('')}</tbody></table>`;
  };

  window.editStudent = id => {
    const row=document.getElementById(`student-row-${id}`);
    row.querySelectorAll('.view-value').forEach(element=>element.hidden=true);
    row.querySelectorAll('.edit-value').forEach(element=>element.hidden=false);
    row.querySelector('.edit-button').hidden=true; row.querySelector('.save-button').hidden=false;
  };

  window.saveStudent = async id => {
    const row=document.getElementById(`student-row-${id}`), values={};
    row.querySelectorAll('.edit-value').forEach(input=>values[input.dataset.field]=input.value);
    const response=await fetch('/api/teacher/students',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id,name:values.name,email:values.email,code:values.code,completedMaterials:values.materials.split(',').map(value=>value.trim()).filter(Boolean)})});
    const data=await response.json();
    if(!response.ok){ alert(data.error||'Could not save changes'); return; }
    await load();
  };

  window.startSelectedLesson = async (id,name) => {
    const material=document.getElementById(`lesson-${id}`).value;
    document.getElementById('materialTitle').value=material;
    const response=await fetch('/api/teacher/live',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({studentId:id,materialType:'workbook',materialTitle:material})});
    const data=await response.json();
    liveId=data.id; liveTitle.textContent=`Live lesson · ${name}`; live.classList.add('open'); pollTimer=setInterval(pollLive,800);
  };

  const materialInfo = title => title === 'Present Simple'
    ? { id:'present-simple-travel', title:'Present Simple: Travel Edition', url:'/workbooks/present-simple-travel/read?teacher=1' }
    : { id:title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''), title, url:null };

  window.viewSelectedMaterial = id => {
    const info=materialInfo(document.getElementById(`lesson-${id}`).value);
    if(!info.url){ alert('The interactive version of this material is coming soon.'); return; }
    window.open(info.url,'_blank','noopener');
  };

  window.assignSelectedMaterial = async id => {
    const info=materialInfo(document.getElementById(`lesson-${id}`).value), status=document.getElementById(`material-status-${id}`);
    status.textContent='Adding workbook…';
    const response=await fetch('/api/teacher/students',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id,addMaterial:{id:info.id,title:info.title}})});
    const data=await response.json();
    status.textContent=response.ok?'Workbook added to the student.':(data.error||'Could not add workbook.');
    if(response.ok) await load();
  };
})();

