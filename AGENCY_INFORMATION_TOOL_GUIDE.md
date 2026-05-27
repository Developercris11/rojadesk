# Agency Information Extractor Tool

## Overview

The **Agency Information Extractor** is a tool that automatically extracts publicly available contact and organizational information from government and municipal websites. It provides structured JSON data with organization details and key personnel information.

## Features

### What It Extracts

**Organization Details:**
- Organization/Agency Name
- Street Address
- City
- State/Province
- ZIP/Postal Code
- Main Phone Number

**Key Personnel:**
- Town/City Manager
- Public Works Director
- Treasurer/Finance Director
- IT Manager
- Town/City Secretary
- Gatekeeper
- Additional listed contacts

**Per-Contact Information:**
- Full Name
- Job Title
- Email Address (if publicly listed)
- Phone Number

### Technical Capabilities

- **Single URL Input**: Accepts one government/municipal website URL
- **Intelligent Crawling**: Automatically prioritizes relevant sections (contact, staff, directory, government, departments)
- **Depth Limiting**: Crawls up to 2-3 levels deep from homepage
- **Domain Respecting**: Stays within the same domain, avoids external links
- **Pattern Recognition**: Uses regex patterns to identify:
  - Email addresses: `name@domain.com`
  - Phone numbers: `(XXX) XXX-XXXX`, `XXX-XXX-XXXX`, `XXX.XXX.XXXX`, `+1 XXX XXX XXXX`
  - State abbreviations and full names
  - ZIP/Postal codes: `XXXXX` or `XXXXX-XXXX`
  - Physical addresses with street, city, state, and ZIP
- **Graceful Degradation**: Handles inconsistent website layouts, returns `null` for missing data
- **Error Handling**: Captures and reports issues without stopping the extraction process

## How to Use

### Accessing the Tool

1. Open RojaDesk dashboard
2. Click **"Agency Info Extractor"** in the sidebar (under Agencies)
3. Alternatively, navigate to `/dashboard/agency-information`

### Basic Usage

1. **Enter a URL**: Input the government or municipal website URL
   - Example: `https://adamstennessee.net`
   - Example: `https://cityofdenver.org`
   - Example: `https://sf.gov`

2. **Submit for Extraction**: Click **"Extract Agency Information"** button

3. **View Results**: Information appears in organized sections:
   - Organization Details (address, phone, etc.)
   - Key Personnel (with contact info)
   - Extraction Metadata
   - Raw JSON response

### Downloading Results

- Click **"Download JSON"** button to save results as a JSON file
- Filename includes timestamp: `agency-TIMESTAMP.json`
- Use for records, imports, or further analysis

### Copying Contact Information

- Click the **copy icon** next to any email to copy it to clipboard
- Useful for bulk email collection or data transfers

## Output Format

### JSON Response Structure

```json
{
  "organizationName": "Town of Adams",
  "streetAddress": "123 Main Street",
  "city": "Adams",
  "state": "TN",
  "zipCode": "12345",
  "mainPhoneNumber": "(615) 555-0100",
  "contacts": {
    "townCityManager": {
      "fullName": "John Smith",
      "jobTitle": "Town Manager",
      "email": "john.smith@adamstennessee.net",
      "phoneNumber": "(615) 555-0101"
    },
    "publicWorksDirector": {
      "fullName": "Jane Doe",
      "jobTitle": "Public Works Director",
      "email": "jane.doe@adamstennessee.net",
      "phoneNumber": "(615) 555-0102"
    },
    "additionalContacts": [
      {
        "fullName": "Bob Johnson",
        "jobTitle": "Finance Director",
        "email": "bob.johnson@adamstennessee.net",
        "phoneNumber": "(615) 555-0103"
      }
    ]
  },
  "extractedAt": "2024-04-03T15:30:00Z",
  "sourceUrl": "https://adamstennessee.net",
  "successfulPages": ["https://adamstennessee.net"],
  "errors": []
}
```

## Important Notes

### Data Quality

- **Public Data Only**: Only extracts information clearly visible on public pages
- **Accuracy**: Relies on website structure and clarity - inconsistent layouts may result in partial data
- **Email Extraction**: Only captures emails that are visible and linked as `mailto:` or text patterns
- **Phone Numbers**: May capture multiple numbers; the first is typically assigned as main number
- **Null Values**: Missing data is represented as `null` or empty arrays

### Best Practices

1. **Test with Known Sites First**: Start with well-organized government websites
2. **Verify Results**: Manual review recommended for critical data
3. **Handle Partial Results**: Some websites may not have all information
4. **Respect Privacy**: Only use extracted data for legitimate business purposes
5. **Check Permissions**: Ensure website allows automated information extraction (check robots.txt)

### Limitations

- Cannot extract information from password-protected pages
- May not work well with JavaScript-heavy or dynamic content sites
- PDFs and other file types are not yet supported
- Social media profiles are not extracted
- Phone numbers in image format won't be captured
- Some specialized formatting may not be recognized

## Troubleshooting

### "Failed to fetch URL"

**Cause**: Website is unreachable or blocking automated access
**Solution**: 
- Verify URL is correct and website is online
- Some websites block automated requests; may need manual access

### "No contacts extracted"

**Cause**: Website layout differs from expected patterns
**Solution**:
- Check if website has a staff/contacts page with contact information
- Some websites may require manual navigation to find specific data
- Extraction patterns may need refinement for unusual layouts

### Partial Data Results

**Cause**: Information may be on different pages not reached by crawler
**Solution**:
- Tool crawls only 2-3 levels deep by default
- Some agencies may have contact info on secondary pages
- Manual verification may be needed for complete accuracy

## Technical Details

### Architecture

- **Frontend**: React component with TypeScript
- **Backend**: Next.js API endpoint (`/api/agency-information`)
- **Method**: HTTP POST with JSON payload
- **Pattern Matching**: Regular expressions for contact information
- **Response Time**: Typically 5-15 seconds depending on website size

### API Endpoint

**URL**: `/api/agency-information`
**Method**: `POST`
**Content-Type**: `application/json`

**Request Body:**
```json
{
  "url": "https://example-municipality.com"
}
```

**Response**: Structured JSON with AgencyData interface

## Use Cases

1. **Government Directory Maintenance**: Quickly update agency contact databases
2. **Lead Generation**: Identify decision-makers at municipal agencies
3. **Competitive Intelligence**: Research agency websites and contacts
4. **Town/City Manager Identification**: Find key leadership contacts
5. **Sales Prospecting**: Identify relevant contacts for services
6. **Data Enrichment**: Supplement existing agency records with found information
7. **Research Projects**: Gather agency information for municipal studies

## Future Enhancements

Potential improvements being considered:

- [ ] Multi-page crawling with configurable depth limits
- [ ] PDF document parsing for staff directories
- [ ] OCR for scanned documents
- [ ] Advanced HTML parsing with headless browser
- [ ] Machine learning for better contact classification
- [ ] Support for international formats (different address/phone formats)
- [ ] Batch URL processing
- [ ] Historical tracking (changes over time)
- [ ] Social media profile linking
- [ ] Custom extraction patterns per state/domain

## Questions or Issues?

Contact support or report issues through the RojaDesk settings panel.
