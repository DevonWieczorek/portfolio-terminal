"use client";
import { useIsMobile } from "@/hooks/use-is-mobile";

const HelpMenu = () => {
    const isMobile = useIsMobile();
    return (
        <div style={{ display: "grid", gridGap: "var(--grid-gap)" }}>
            <p>commands:</p>
            <p>resume: displays plain-text version of Devon&apos;s resume</p>
            <p>contact: find out where to reach Devon</p>
            <p>ask: asks AI Devon a question</p>
            <p>fun-fact: displays a random &quot;fun fact&quot; about Devon</p>
            <p>clear: clear the console</p>
            <p>help: displays this menu</p>
            {!isMobile && (
                <>
                    <p>
                        <br />
                        <br />
                        View this page on desktop for the full, 3D experience.
                    </p>
                    <p>
                        <br />
                        <br />
                        Press ESC to exit computer.
                    </p>
                </>
            )}
        </div>
    );
};

export default HelpMenu;
