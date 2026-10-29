// Codes are shown once. While they're on screen, leaving the page asks first; closing the tab gets the browser's prompt.
// Going to login (log out, idle lock, session end) is never held up: those must clear the codes off an unattended screen
import { useBlocker } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function CodesGuard({ active }: { active: boolean }) {
  const blocker = useBlocker({
    shouldBlockFn: ({ next }) => next.pathname !== "/login",
    enableBeforeUnload: active,
    disabled: !active,
    withResolver: true,
  });

  return (
    <Dialog open={blocker.status === "blocked"} onOpenChange={(open) => !open && blocker.reset?.()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave without printing?</DialogTitle>
          <DialogDescription>
            These codes can't be shown again. If they aren't printed yet, you'll have to re-issue them, and any copy already
            handed out stops working.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => blocker.reset?.()}>
            Stay on this page
          </Button>
          <Button variant="destructive" onClick={() => blocker.proceed?.()}>
            Leave and discard codes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
