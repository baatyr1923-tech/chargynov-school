/* №35 мектеп — бардык онлайн тесттердин жыйынтыгын Google Sheets журналына жөнөтүү */
(function(){
  "use strict";
  const ENDPOINT = "https://script.google.com/macros/s/AKfycbxQ3cbPpgN3A6fkjQ9nYgHe2-xgVMxlzKqdkBqgQRIf17ZVV6Azq0r4bvUlWJ08jUv1iA/exec";
  const RESULT_SELECTORS = ["#result", "#quizResult", ".result", "[data-test-result]"];
  const $ = (s) => document.querySelector(s);
  function resultNode(){ for(const s of RESULT_SELECTORS){const n=$(s);if(n)return n;} return null; }
  function field(selectors){for(const s of selectors){const n=$(s);if(n && String(n.value||"").trim())return String(n.value).trim();}return "";}
  function groups(){
    const inputs=[...document.querySelectorAll('input[type="radio"]')];
    return [...new Set(inputs.map(x=>x.name).filter(Boolean))];
  }
  function parseResult(text){
    const clean=String(text||"").replace(/\s+/g," ").trim();
    let m=clean.match(/(\d+)\s*\/\s*(\d+)/);
    let total=m?Number(m[2]):groups().length;
    let correct=m?Number(m[1]):null;
    if(correct===null){
      m=clean.match(/(?:туура жооп|балл|упай)\s*[:：]?\s*(\d+)/i);
      if(m)correct=Number(m[1]);
    }
    if(correct===null){
      m=clean.match(/(\d+(?:[.,]\d+)?)\s*%/);
      if(m && total)correct=Math.round(Number(m[1].replace(",","."))*total/100);
    }
    const gm=clean.match(/баа(?:сы)?\s*[:：]?\s*([2-5])/i);
    const grade=gm?Number(gm[1]):(total&&correct!==null?(correct/total>=.9?5:correct/total>=.7?4:correct/total>=.5?3:2):"");
    return {correct,total,grade,percent:total&&correct!==null?Math.round(correct/total*100):""};
  }
  function pageInfo(){
    const title=(document.title||"Онлайн тест").trim();
    const heading=($("h1")?.innerText||$("h2")?.innerText||title).trim();
    const isOrt=/ort/i.test(location.pathname);
    const isTechnology=/technology/i.test(location.pathname);
    const direction=isOrt?( /кыргыз/i.test(title+" "+heading)?"Кыргыз тили":/аралаш|mixed/i.test(title+" "+heading)?"Аралаш":"Математика"):(isTechnology?"Технология":"Информатика");
    const classMatch=(title+" "+heading+" "+location.pathname).match(/([789])\s*[-–]?\s*класс/i);
    return {title:heading||title,category:isOrt?"ОРТ даярдоо":(isTechnology?"Технология":"Информатика"),direction,defaultClass:classMatch?classMatch[1]+"-класс":(isOrt?"ОРТ даярдоо":"")};
  }
  function selectedAnswers(){
    const out={};
    for(const name of groups()){
      const picked=document.querySelector('input[type="radio"][name="'+CSS.escape(name)+'"]:checked');
      out[name]=picked?picked.value:"";
    }
    return out;
  }
  function addSendButton(node){
    if(node.dataset.journalReady==="1" || !node.textContent.trim())return;
    node.dataset.journalReady="1";
    const wrap=document.createElement("div");
    wrap.className="journal-submit-wrap";
    wrap.style.cssText="margin:16px 0;padding:14px;background:#eef6ff;border:1px solid #bfd8f5;border-radius:10px;";
    const btn=document.createElement("button");
    btn.type="button";btn.textContent="📩 Жыйынтыкты журналга жөнөтүү";
    btn.style.cssText="background:#1769aa;color:#fff;border:0;border-radius:8px;padding:12px 18px;font-size:16px;font-weight:700;cursor:pointer;";
    const status=document.createElement("div");
    status.setAttribute("aria-live","polite");
    status.style.cssText="margin-top:8px;font-size:14px;color:#234;";
    btn.addEventListener("click",async function(){
      const student=field(["#studentName","#student","#name",'input[name="studentName"]']);
      const studentClass=field(["#studentClass","#class","#student-class",'input[name="studentClass"]','select[name="studentClass"]']);
      const info=pageInfo();
      const finalName=student||prompt("Окуучунун аты-жөнүн жазыңыз:");
      if(!finalName||!finalName.trim()){status.textContent="Аты-жөнү киргизилген жок.";return;}
      const finalClass=studentClass||prompt("Классын жазыңыз (мисалы: 7-А):",info.defaultClass);
      if(!finalClass||!finalClass.trim()){status.textContent="Класс киргизилген жок.";return;}
      const parsed=parseResult(node.innerText||node.textContent);
      if(parsed.correct===null||!parsed.total){status.textContent="Упайды аныктай алган жокпуз. Мугалимге кабарлаңыз.";return;}
      const payload={
        studentName:finalName.trim(),studentClass:finalClass.trim(),
        category:info.category,direction:info.direction,testTitle:info.title,
        questionCount:parsed.total,correctCount:parsed.correct,score:parsed.correct,
        grade:parsed.grade,answersJson:JSON.stringify(selectedAnswers()),
        sourcePage:location.href,pageUrl:location.href
      };
      btn.disabled=true;btn.textContent="Жөнөтүлүүдө…";status.textContent="Жыйынтык журналга жөнөтүлүп жатат.";
      try{
        const body=new URLSearchParams();
        Object.keys(payload).forEach(k=>body.append(k,String(payload[k])));
        await fetch(ENDPOINT,{method:"POST",mode:"no-cors",headers:{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"},body:body.toString()});
        btn.textContent="✓ Жөнөтүү өтүнүчү берилди";
        status.textContent="Сурам жөнөтүлдү. Мугалим Google Таблицанын «Жыйынтыктар» барагынан текшерет.";
      }catch(err){
        btn.disabled=false;btn.textContent="📩 Кайра жөнөтүү";
        status.textContent="Жөнөтүү ишке ашкан жок. Интернет байланышын текшерип, кайра аракет кылыңыз.";
      }
    });
    wrap.append(btn,status);
    node.insertAdjacentElement("afterend",wrap);
  }
  function scan(){const n=resultNode();if(n && n.textContent.trim() && n.style.display!=="none")addSendButton(n);}
  const observer=new MutationObserver(scan);
  function start(){observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["style","class"]});scan();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();