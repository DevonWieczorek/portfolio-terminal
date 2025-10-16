"use client";

import { useEffect, useState } from "react";
import Terminal from "@/components/Terminal";
import R3FScene from "@/components/R3FScene";
import styles from "@/styles/Home.module.scss";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useExperience } from "@/lib/stores/useExperience";

export default function Home() {
        const isMobile = useIsMobile();
        const [, setSelectedOption] = useState<string>("");
        const experience = useExperience(state => state.experience);
        const target = useExperience(state => state.target);
        const requestExperience = useExperience(state => state.requestExperience);

        const showTerminal = isMobile || (experience === "terminal" && target === "terminal");
        const shouldRenderTerminal = isMobile || experience === "terminal" || target === "terminal";
        const sceneIsInactive = !isMobile && target === "terminal";

        useEffect(() => {
                if (isMobile) {
                        return;
                }

                if (!(experience === "terminal" && target === "terminal")) {
                        return;
                }

                const handleKeyDown = (event: KeyboardEvent) => {
                        if (event.key === "Escape") {
                                event.preventDefault();
                                requestExperience("scene");
                        }
                };

                window.addEventListener("keydown", handleKeyDown);

                return () => {
                        window.removeEventListener("keydown", handleKeyDown);
                };
        }, [experience, isMobile, requestExperience, target]);

        return (
                <div className={styles.home}>
                        {isMobile ? (
                                <Terminal onCommand={setSelectedOption} />
                        ) : (
                                <>
                                        <div
                                                className={`${styles.sceneLayer} ${
                                                        sceneIsInactive ? styles.sceneLayerInactive : ""
                                                }`}
                                        >
                                                <R3FScene />
                                        </div>
                                        {shouldRenderTerminal && (
                                                <div
                                                        className={`${styles.terminalLayer} ${
                                                                showTerminal ? styles.terminalLayerVisible : ""
                                                        }`}
                                                >
                                                        <Terminal onCommand={setSelectedOption} />
                                                </div>
                                        )}
                                </>
                        )}
                </div>
        );
}
