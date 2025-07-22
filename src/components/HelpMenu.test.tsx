import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import HelpMenu from "./HelpMenu";

describe("HelpMenu", () => {
	it("renders all help commands", () => {
		render(<HelpMenu />);
		[/resume/i, /contact/i, /ask/i, /fun-fact/i, /clear/i, /help/i].forEach(
			cmd => {
				expect(screen.getByText(cmd)).toBeInTheDocument();
			}
		);
	});
});
