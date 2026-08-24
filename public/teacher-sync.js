(() => {
  const SUPABASE_URL='https://pxxkzshjustlydenxyhd.supabase.co';
  const SUPABASE_KEY='sb_publishable_dzS8FgF8GuHrtnZOR8lz-w_0Q1u4JCS';
  const token=()=>sessionStorage.getItem('librimania-teacher-token')||'';
  async function supabase(path,options={}){
    const response=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...options,headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${token()}`,'content-type':'application/json',...(options.headers||{})}});
    const text=await response.text(),data=text?JSON.parse(text):null;
    if(!response.ok) throw new Error(data?.message||'Supabase request failed');
    return data;
  }
  const originalSubmit=addForm.onsubmit;
  addForm.onsubmit=async event=>{
    event.preventDefault();
    if(!token()){
      formMsg.textContent='Please log in through the main site with librimaniastore@gmail.com before adding students.';
      return;
    }
    const name=document.getElementById('name').value.trim();
    const email=document.getElementById('email').value.trim().toLowerCase();
    const code=document.getElementById('code').value.trim().toUpperCase();
    formMsg.textContent='Creating one student account for the dashboard and Writing Trainer…';
    let created=null;
    try{
      created=await supabase('students',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({name,email,access_code:code,active:true})});
      const siteResponse=await fetch('/api/teacher/students',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name,email,code})});
      const siteData=await siteResponse.json();
      if(!siteResponse.ok) throw new Error(siteData.error||'Could not create site access');
      addForm.reset();
      formMsg.textContent='Student created everywhere. The same code opens the dashboard and Writing Trainer.';
      await load();
    }catch(error){
      if(created?.[0]?.id){
        try{await supabase(`students?id=eq.${created[0].id}`,{method:'DELETE'});}catch(rollbackError){}
      }
      formMsg.textContent=error.message;
    }
  };
})();

