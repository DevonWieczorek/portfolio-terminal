const main = () => {
	const fs = require('fs');
	const path = require('path');
	const pdf2md = require('@opendocsg/pdf2md');

	const pdfFilePath = path.resolve(__dirname, '../src/assets/resume.pdf');
	const outputFilePath = path.resolve(__dirname, '../src/assets/resume.md');

	// Read the PDF file
	const pdfBuffer = fs.readFileSync(pdfFilePath);
	const utf8Buffer = Buffer.from(pdfBuffer, 'utf8');

	// Convert the PDF to Markdown
	pdf2md(new Uint8Array(utf8Buffer)) // Convert Buffer to Uint8Array
	.then(markdownText => {
		// Write the Markdown text to a file
		fs.writeFileSync(path.resolve(outputFilePath), markdownText, 'utf8');
		console.log(`Markdown file created at ${outputFilePath}`);
	})
	.catch(err => {
		console.error('Error converting PDF to Markdown:', err);
	});
}

main();