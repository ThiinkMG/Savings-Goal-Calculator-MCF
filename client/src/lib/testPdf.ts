export async function testSimplePDF(): Promise<void> {
  try {
    console.log('Starting PDF test...');
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.jsPDF;
    console.log('jsPDF imported successfully');
    
    const pdf = new jsPDF();
    console.log('PDF instance created');
    
    pdf.text('Hello World', 10, 10);
    console.log('Text added to PDF');
    
    pdf.save('test.pdf');
    console.log('PDF save called');
  } catch (error) {
    console.error('PDF test failed:', error);
    throw error;
  }
}