// src/PDFInvoice.jsx
import { Page, Text, View, Document, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30 },
  header: { fontSize: 24, marginBottom: 20 },
  row: { flexDirection: 'row', borderBottom: '1px solid #eee', padding: 5 }
});

const InvoicePDF = ({ invoice }) => (
  <Document>
    <Page style={styles.page}>
      <Text style={styles.header}>Invoice #{invoice.invoiceNumber}</Text>
      <View style={styles.row}>
        <Text>Description</Text>
        <Text>Amount</Text>
      </View>
      {invoice.items.map((item, i) => (
        <View key={i} style={styles.row}>
          <Text>{item.description}</Text>
          <Text>${item.amount}</Text>
        </View>
      ))}
      <View style={styles.row}>
        <Text>TOTAL</Text>
        <Text>${invoice.items.reduce((sum, item) => sum + item.amount, 0)}</Text>
      </View>
    </Page>
  </Document>
);

export function PDFInvoice({ invoice }) {
  return (
    <PDFDownloadLink 
      document={<InvoicePDF invoice={invoice} />} 
      fileName={`invoice_${invoice.invoiceNumber}.pdf`}
    >
      {({ loading }) => (loading ? 'Generating...' : 'Download PDF')}
    </PDFDownloadLink>
  );
}