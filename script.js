const menu=document.querySelector('.menu');const nav=document.querySelector('nav');menu.addEventListener('click',()=>nav.classList.toggle('open'));document.querySelectorAll('nav a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));const botButton = document.getElementById("bot-button");
const botBox = document.getElementById("bot-box");
const botClose = document.getElementById("bot-close");
const botQuestions = document.querySelectorAll(".bot-question");
const botAnswer = document.getElementById("bot-answer");

if (botButton && botBox) {
  botButton.addEventListener("click", function () {
    botBox.style.display = "block";
    botButton.style.display = "none";
  });
}

if (botClose && botBox && botButton) {
  botClose.addEventListener("click", function () {
    botBox.style.display = "none";
    botButton.style.display = "block";
  });
}

botQuestions.forEach(function (button) {
  button.addEventListener("click", function () {
    const answer = this.getAttribute("data-answer");

    botAnswer.innerHTML =
      "<strong>Бот:</strong> " + answer;
  });
});
