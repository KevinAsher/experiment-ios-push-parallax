const snapShell = document.getElementById("snapShell");
const goForwardBtn = document.getElementById("goForwardBtn");
const goBackBtn = document.getElementById("goBackBtn");
const screenOne = document.getElementById("screen-1");
const screenTwo = document.getElementById("screen-2");

function scrollToScreen(screen) {
  if (!screen) {
    return;
  }

  snapShell.scrollTo({
    left: screen.offsetLeft,
    behavior: "smooth"
  });
}

goForwardBtn.addEventListener("click", () => {
  scrollToScreen(screenTwo);
});

goBackBtn.addEventListener("click", () => {
  scrollToScreen(screenOne);
});
