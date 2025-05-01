import { Page, Text, View, Document, StyleSheet, PDFDownloadLink, Image, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

// Register professional fonts
Font.register({
  family: 'Helvetica-Bold',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Helvetica/Helvetica-Bold.ttf',
});

Font.register({
  family: 'Helvetica',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Helvetica/Helvetica.ttf',
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#2d3748',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: '1pt solid #e2e8f0',
  },
  companySection: {
    width: '60%',
    flexDirection: 'column',
  },
  invoiceSection: {
    width: '35%',
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 4,
  },
  logo: {
    width: 120,
    marginBottom: 10,
  },
  companyName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 18,
    color: '#1a365d',
    marginBottom: 4,
  },
  companyDetails: {
    fontSize: 9,
    color: '#718096',
    lineHeight: 1.4,
  },
  invoiceTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 24,
    color: '#2d3748',
    marginBottom: 8,
  },
  invoiceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  invoiceLabel: {
    fontFamily: 'Helvetica-Bold',
    width: '40%',
  },
  invoiceValue: {
    width: '60%',
    textAlign: 'right',
  },
  clientSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  clientBox: {
    width: '48%',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
  },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    color: '#2d3748',
    marginBottom: 8,
    borderBottom: '1pt solid #e2e8f0',
    paddingBottom: 4,
  },
  table: {
    width: '100%',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1a365d',
    color: 'white',
    paddingVertical: 8,
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #e2e8f0',
    paddingVertical: 8,
  },
  colDescription: { width: '45%', paddingLeft: 4 },
  colQty: { width: '15%', textAlign: 'right' },
  colRate: { width: '20%', textAlign: 'right' },
  colAmount: { width: '20%', textAlign: 'right' },
  totals: {
    width: '30%',
    marginLeft: 'auto',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  grandTotal: {
    fontFamily: 'Helvetica-Bold',
    borderTop: '1pt solid #2d3748',
    paddingTop: 6,
    marginTop: 6,
  },
  paymentSection: {
    marginTop: 25,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    fontSize: 9,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#718096',
    borderTop: '1pt solid #e2e8f0',
    paddingTop: 8,
  },
});

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

const InvoicePDF = ({ invoice, companyInfo, billingInfo }) => {
  const subtotal = invoice.items.reduce((sum, item) => sum + (item.amount * item.quantity), 0);
  const taxAmount = subtotal * (invoice.taxRate / 100);
  const discountAmount = subtotal * (invoice.discount / 100);
  const total = subtotal + taxAmount - discountAmount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.companySection}>
            {companyInfo.photoURL && (
              <Image src={companyInfo.photoURL} style={styles.logo} />
            )}
            <Text style={styles.companyName}>{companyInfo.name}</Text>
            <Text style={styles.companyDetails}>
              {companyInfo.address}{'\n'}
              Phone: {companyInfo.phone}{'\n'}
              Email: {companyInfo.email}{'\n'}
              {companyInfo.website && `Website: ${companyInfo.website}`}{'\n'}
              {companyInfo.taxId && `Tax ID: ${companyInfo.taxId}`}
            </Text>
          </View>

          <View style={styles.invoiceSection}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <View style={styles.invoiceMeta}>
              <Text style={styles.invoiceLabel}>Invoice Number:</Text>
              <Text style={styles.invoiceValue}>#{invoice.invoiceNumber}</Text>
            </View>
            <View style={styles.invoiceMeta}>
              <Text style={styles.invoiceLabel}>Invoice Date:</Text>
              <Text style={styles.invoiceValue}>
                {format(new Date(invoice.date), 'dd MMM yyyy')}
              </Text>
            </View>
            {invoice.dueDate && (
              <View style={styles.invoiceMeta}>
                <Text style={styles.invoiceLabel}>Due Date:</Text>
                <Text style={styles.invoiceValue}>
                  {format(new Date(invoice.dueDate), 'dd MMM yyyy')}
                </Text>
              </View>
            )}
            <View style={styles.invoiceMeta}>
              <Text style={styles.invoiceLabel}>Status:</Text>
              <Text style={styles.invoiceValue}>{invoice.status || 'PENDING'}</Text>
            </View>
          </View>
        </View>

        {/* Client and Company Info */}
        <View style={styles.clientSection}>
          <View style={styles.clientBox}>
            <Text style={styles.sectionTitle}>BILL TO</Text>
            <Text style={{ marginBottom: 4 }}>{invoice.clientName}</Text>
            {invoice.clientEmail && <Text>{invoice.clientEmail}</Text>}
            {invoice.clientAddress && <Text>{invoice.clientAddress}</Text>}
          </View>

          <View style={styles.clientBox}>
            <Text style={styles.sectionTitle}>COMPANY DETAILS</Text>
            <Text style={{ marginBottom: 4 }}>{companyInfo.name}</Text>
            <Text>{companyInfo.address}</Text>
            <Text>Phone: {companyInfo.phone}</Text>
            <Text>Email: {companyInfo.email}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View>
          <Text style={styles.sectionTitle}>ITEMIZED CHARGES</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.colDescription}>Description</Text>
              <Text style={styles.colQty}>Qty</Text>
              <Text style={styles.colRate}>Unit Price</Text>
              <Text style={styles.colAmount}>Amount</Text>
            </View>
            
            {invoice.items.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.colDescription}>{item.description}</Text>
                <Text style={styles.colQty}>{item.quantity}</Text>
                <Text style={styles.colRate}>{formatCurrency(item.amount)}</Text>
                <Text style={styles.colAmount}>{formatCurrency(item.amount * item.quantity)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totals Section */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            <Text>{formatCurrency(subtotal)}</Text>
          </View>
          
          {invoice.taxRate > 0 && (
            <View style={styles.totalRow}>
              <Text>Tax ({invoice.taxRate}%):</Text>
              <Text>{formatCurrency(taxAmount)}</Text>
            </View>
          )}
          
          {invoice.discount > 0 && (
            <View style={styles.totalRow}>
              <Text>Discount ({invoice.discount}%):</Text>
              <Text>-{formatCurrency(discountAmount)}</Text>
            </View>
          )}
          
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text>TOTAL DUE:</Text>
            <Text>{formatCurrency(total)}</Text>
          </View>
        </View>

        {/* Payment Instructions */}
        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>PAYMENT INFORMATION</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: '48%' }}>
              {billingInfo.bankName && (
                <>
                  <Text style={{ fontFamily: 'Helvetica-Bold' }}>Bank Transfer:</Text>
                  <Text>{billingInfo.bankName}</Text>
                  <Text>Account: {billingInfo.accountNumber}</Text>
                  {billingInfo.swiftCode && <Text>SWIFT: {billingInfo.swiftCode}</Text>}
                </>
              )}
            </View>
            <View style={{ width: '48%' }}>
              {billingInfo.upiId && (
                <>
                  <Text style={{ fontFamily: 'Helvetica-Bold' }}>Digital Payments:</Text>
                  <Text>UPI ID: {billingInfo.upiId}</Text>
                </>
              )}
            </View>
          </View>
          <Text style={{ marginTop: 8 }}>
            Payment Terms: {companyInfo.paymentTerms || 'Due upon receipt'}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>{companyInfo.name} | Registered Address: {companyInfo.address} | Tax ID: {companyInfo.taxId}</Text>
          <Text>This is a computer-generated invoice and does not require a physical signature</Text>
        </View>
      </Page>
    </Document>
  );
};

const PDFInvoiceWrapper = ({ invoice }) => {
  const [companyData, setCompanyData] = useState(null);
  const [billingData, setBillingData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', invoice.userId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setCompanyData({
            name: data.company?.name,
            address: data.company?.address,
            email: data.company?.email,
            phone: data.company?.phone,
            website: data.company?.website,
            taxId: data.company?.taxId,
            paymentTerms: data.company?.paymentTerms,
            photoURL: data.photoURL
          });
          setBillingData(data.billing || {});
        }
      } catch (error) {
        console.error('Error fetching company data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [invoice.userId]);

  if (loading) return <div>Loading invoice details...</div>;

  return (
    <PDFDownloadLink
      document={<InvoicePDF 
        invoice={invoice} 
        companyInfo={companyData} 
        billingInfo={billingData}
      />}
      fileName={`INVOICE-${invoice.invoiceNumber}.pdf`}
      style={{
        textDecoration: 'none',
        padding: '12px 24px',
        backgroundColor: '#1a365d',
        color: 'white',
        borderRadius: '4px',
        fontFamily: 'Helvetica, Arial, sans-serif',
        fontWeight: 'bold',
        transition: 'background-color 0.3s',
        ':hover': {
          backgroundColor: '#2c5282',
        },
      }}
    >
      {({ loading }) => (loading ? 'Preparing Document...' : 'Download Invoice')}
    </PDFDownloadLink>
  );
};

export default PDFInvoiceWrapper;