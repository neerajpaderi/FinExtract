import { SampleTemplate } from "./types";

export const SAMPLE_TEMPLATES: SampleTemplate[] = [
  {
    id: "amazon-invoice",
    name: "Amazon Invoice (Scanned OCR)",
    description: "Messy scanned text with lines, taxes, shipping, and total billing.",
    text: `AMAZON.COM SERVICES LLC
Order History Summary
Order Date: May 14, 2026
Order ID: 114-9482049-5912402
Shipment Details: Standard Delivery
Sold by: Amazon.com Services LLC

Billing Summary:
---------------------------------------------
1. Amazon Basics 100-pack Sticky Notes   $14.99
2. High-Yield Black Toner for HP Laser   $89.50
   ASIN: B0892H19K2
---------------------------------------------
Item(s) Subtotal:                  $104.49
Shipping & Handling:                $4.99
Free Shipping Applied:             -$4.99
Total Before Tax:                  $104.49
Estimated Tax to be collected:      $8.75
---------------------------------------------
GRAND TOTAL:                       $113.24
---------------------------------------------
Payment Method: Mastercard ending in 4821

Shipping Address:
Finance Dept. / Acme Corp
100 Innovation Way Suite 400
Boston, MA 02110
United States`
  },
  {
    id: "stripe-receipt",
    name: "Zoom SaaS Invoice (Email)",
    description: "A subscription confirmation email from Stripe Billing.",
    text: `From: Zoom Video Communications Inc <no-reply@zoom.us>
To: billing@acme-inc.com
Date: Fri, 10 Apr 2026 09:22:15 -0800
Subject: Your Zoom Pro subscription invoice (INV-1948271)

ZOOM VIDEO COMMUNICATIONS INC.
55 Almaden Blvd, San Jose, CA 95113

INVOICE RECEIPT
Invoice Number: INV-1948271
Account ID: 94827104

Charge Details:
---------------------------------------------
Billing Cycle: Apr 10, 2026 - May 09, 2026
Plan: Zoom Pro Plan (10 Licensed Users)
Rate: $15.99 / user / month
Discounts applied: -$10.00 coupon code

Subtotal:                          $149.90
Tax (9.50%):                       $14.24
---------------------------------------------
Total Charged:                     $164.14
---------------------------------------------

Transaction Status: SUCCESSFUL
Charged to: Visa ending in 9044
Stripe processor ref: ch_19482SdgWqS`
  },
  {
    id: "restaurant-receipt",
    name: "Blue Bottle Coffee (Paper Receipt)",
    description: "Multi-line paper thermal receipt from a lunch and coffee meeting.",
    text: `   BLUE BOTTLE COFFEE
   142 SANSOME ST
   SAN FRANCISCO, CA 94104
   TEL: (415) 397-1511

STATION: REGISTER #2
TRANS #: 948204                   DATE: 06/18/2026
CASHIER: Maya                     TIME: 09:12:44 AM

ITEMS:
-----------------------------------------------
1   LATTE - OAT OAT               $6.25
1   DRIP - SINGLE ORIGIN          $4.50
2   AVOCADO SMASH TOAST          $24.00
    ($12.00 each)
-----------------------------------------------
SUB-TOTAL:                       $34.75
SALES TAX (8.63%):                $3.00
-----------------------------------------------
AMOUNT DUE:                      $37.75
Payment Type: AMERICAN EXPRESS
Card Number: XVXVXVXVXVXV2041
Signature Approved.

Thank you for visiting Blue Bottle!
Share your feedback at craft@bluebottle.com`
  },
  {
    id: "unstructured-csv",
    name: "Salesforce Ledger Row (CSV)",
    description: "A single row of unformatted ledger text from an export CSV dump.",
    text: `"INV-2026-9042","03/05/2026","9281.50","Salesforce.com Inc.","CRM Enterprise Annual Subscription License Renewal for 15 Seats","03/05/2026 Paid Via Credit Card Auth 829A1","GL-3918: Software/SaaS"`
  },
  {
    id: "united-airlines",
    name: "United Airlines (Travel Ticket)",
    description: "Airline flight itinerary email with dates, traveler info, and fare details.",
    text: `UNITED AIRLINES - TICKET RECEIPT
Booking Code: L84W9V
Date of Issue: March 22, 2026

Passenger: NEERAJ PADERI
Frequent Flyer #: UA-94829370
Flight: UA 1045
From: SFO (San Francisco, CA)  departure: 2026-04-15 08:30 AM
To: JFK (New York, NY)         arrival: 2026-04-15 04:55 PM
Seat: 14D Economy Plus

Payment Breakdown:
---------------------------------------------
Airfare (Base):                    $412.00
Carrier-Imposed Surcharges:         $45.00
U.S. Federal Excise Tax:            $34.50
September 11 Security Fee:          $11.20
---------------------------------------------
Total Ticket Price:                $502.70
---------------------------------------------
Payment Method: Visa ending in 4118
Status: Ticketed & Confirmed`
  }
];
