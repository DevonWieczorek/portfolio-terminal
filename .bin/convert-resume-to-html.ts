const main = () => {
	const fs = require('fs');
	const path = require('path');
	const pdfParse = require('pdf-parse');
	const puppeteer = require('puppeteer');

	const pdfFilePath = path.resolve(__dirname, '../src/assets/resume.pdf');
	const outputFilePath = path.resolve(__dirname, '../src/assets/resume.html');

	async function convertPDFtoHTML(pdfPath, outputPath) {
		try {
			// Read the PDF file
			const pdfFile = fs.readFileSync(pdfPath);
			
			// Parse the PDF content
			const pdfData = await pdfParse(pdfFile);
			
			// Extract text content
			const textContent = pdfData.text;

			// Launch a new browser instance
			const browser = await puppeteer.launch();
			const page = await browser.newPage();

			// Generate HTML content
			const htmlContent = `
			<!DOCTYPE html>
			<html>
				<head>
				<title>Converted PDF</title>
				</head>
				<body>
				<pre>${textContent}</pre>
				</body>
			</html>
			`;

			// Set the HTML content to the page
			await page.setContent(htmlContent);

			// Save the HTML content to a file
			await page.content().then((content) => {
			fs.writeFileSync(outputPath, content);
			});

			console.log('PDF converted to HTML successfully');

			// Close the browser
			await browser.close();
		} catch (error) {
			console.error('Error converting PDF to HTML:', error);
		}
	}

	// Usage
	convertPDFtoHTML(pdfFilePath, outputFilePath);
}

main();