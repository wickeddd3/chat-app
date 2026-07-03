import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useLocation, useOutlet } from "react-router";
import { pageVariants } from "@/shared/lib/motion";

export interface AnimatedOutletProps {
  /**
   * Derives the animation key from the current pathname. Change it to control
   * how coarse the transition is — e.g. key by the first path segment so
   * navigating between nested child routes does not re-animate (and re-mount)
   * the shared parent. Defaults to the full pathname.
   */
  getKey?: (pathname: string) => string;
  variants?: Variants;
  className?: string;
}

/**
 * Drop-in replacement for react-router's <Outlet /> that fades/slides the
 * routed subtree in and out on navigation via framer-motion. Respects the
 * app-level MotionConfig (reduced motion) automatically.
 */
export function AnimatedOutlet({
  getKey,
  variants = pageVariants,
  className,
}: AnimatedOutletProps) {
  const location = useLocation();
  const outlet = useOutlet();
  const key = getKey ? getKey(location.pathname) : location.pathname;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={key}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}
