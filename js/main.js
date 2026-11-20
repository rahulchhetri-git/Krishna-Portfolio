import { initFooter } from "./footer.js";
import { initFeaturedContent } from "./featured-content.js";
import { initServices } from "./services.js";
import { initHeroEffects } from "./hero.js";
import { initSectionReveals } from "./section-reveals.js";
import { initMilestones } from "./milestones.js";

const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
const tabletLayout = window.matchMedia("(max-width: 960px)");
const hasIO = "IntersectionObserver" in window;

initFooter();
initFeaturedContent();
initServices();
initHeroEffects({ reduceMotion, tabletLayout, hasIO });
initSectionReveals({ reduceMotion, hasIO });
initMilestones();
