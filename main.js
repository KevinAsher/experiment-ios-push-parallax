const goForwardBtn = document.getElementById("goForwardBtn");
const goBackBtn = document.getElementById("goBackBtn");
const screenOne = document.getElementById("screen-1");
const screenTwo = document.getElementById("screen-2");
const root = document.documentElement;

let transitionToken = 0;

function scrollToScreen(screen, direction) {
  if (!screen) {
    return;
  }

  const scrollImmediately = () => {
    screen.scrollIntoView({
      behavior: "instant",
      block: "nearest",
      inline: "start"
    });
  };

  if (typeof document.startViewTransition === "function") {
    transitionToken += 1;
    const currentToken = transitionToken;
    root.dataset.navDirection = direction;

    const stickyContent = document.querySelector(".sticky-content");
    stickyContent.parentElement.classList.remove("perspective");
    stickyContent.classList.remove("sticky-content-transform");
    const previousOverscrollBehavior = getComputedStyle(document.documentElement).overscrollBehavior;
    document.documentElement.style.overscrollBehavior = "none";
    const transition = document.startViewTransition(() => {
      // remove the transform from the sticky content
      scrollImmediately();
    });

    transition.finished.finally(() => {
      if (transitionToken === currentToken) {
        delete root.dataset.navDirection;
      }
      stickyContent.parentElement.classList.add("perspective");
      stickyContent.classList.add("sticky-content-transform");
      document.documentElement.style.overscrollBehavior = previousOverscrollBehavior;
    });

    return;
  }

  scrollImmediately();
}

goForwardBtn.addEventListener("click", () => {
  scrollToScreen(screenTwo, "push");
});

goBackBtn.addEventListener("click", () => {
  scrollToScreen(screenOne, "pop");
});
