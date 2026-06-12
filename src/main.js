import { state } from "./state.js";
import { LS, SV } from "./storage.js";

const editor = document.getElementById("editor");
const wordCount = document.getElementById("wordCount");
const limitInfo = document.getElementById("limitInfo");
const fontSize = document.getElementById("fontSize");

const buttons = document.querySelectorAll(".task-btn");

function countWords(text) {
  return text.trim()
    ? text.trim().split(/\s+/).length
    : 0;
}

function updateCounter() {

  const words = countWords(editor.value);

  wordCount.textContent = `${words} mots`;

  const limits = state.limits[state.activeTask];

  limitInfo.textContent =
    `${limits.min}-${limits.max}`;

  if(words < limits.min){
    wordCount.className = "warning";
  }
  else if(words > limits.max){
    wordCount.className = "danger";
  }
  else{
    wordCount.className = "success";
  }
}

function saveDraft() {

  SV(
    `draft_task_${state.activeTask}`,
    editor.value
  );
}

function loadDraft() {

  editor.value =
    LS(
      `draft_task_${state.activeTask}`,
      ""
    );

  updateCounter();
}

editor.addEventListener("input", () => {

  updateCounter();
  saveDraft();

});

buttons.forEach(btn => {

  btn.addEventListener("click", () => {

    buttons.forEach(b =>
      b.classList.remove("active")
    );

    btn.classList.add("active");

    state.activeTask =
      Number(btn.dataset.task);

    loadDraft();

  });

});

document
.querySelectorAll("#accentBar button")
.forEach(btn => {

  btn.addEventListener("click", () => {

    editor.setRangeText(
      btn.textContent,
      editor.selectionStart,
      editor.selectionEnd,
      "end"
    );

    editor.focus();

  });

});
fontSize.addEventListener("change", () => {

  editor.style.fontSize =
    fontSize.value + "px";

  SV(
    "editorFontSize",
    fontSize.value
  );

});
const savedFontSize =
  LS(
    "editorFontSize",
    16
  );

fontSize.value =
  savedFontSize;

editor.style.fontSize =
  savedFontSize + "px";
loadDraft();
