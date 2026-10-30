# Attendance Manager

## Overview
A React web application designed to help administrators manage local player attendance, review individual attendance histories, and summarize attendance over time. The application supports importing existing daily attendance records from CSV files.

## Features

**Dashboard**
- View attendance summaries and charts over a selected date range.
- Review attendance trends by day or month.

**Attendance**
- View daily attendance records.
- Filter records by date range.
- Export attendance records to CSV.

**Players**
- Browse and search the player list.
- Open individual player profiles.

**Player Profiles**
- Review an individual player's attendance history and related statistics.

**CSV Imports**
- Upload existing attendance CSV files.
- Map CSV columns to the application's fields and preview the data before importing.
- Append imported records to existing data or replace existing records.
- Review import history and download previously imported CSV files.

**Responsive Design**
- Responsive layouts for desktop, tablet, and mobile devices.
- Tested across various screen sizes to verify layout and usability.

## Technologies
- React
- JavaScript
- CSS
- Browser localStorage
- CSV file processing

## Data Storage
The current version stores attendance records and import history in the browser using localStorage. Data is not automatically shared between devices or browsers.

Long term storage handling is currently in progress.

## Limitations and Future Improvements
- **Daily attendance only:** Each player is tracked as attending or not attending on a given date. The application does not record multiple login and logout sessions for the same player on the same day.
- **Local storage:** Data is stored in the browser rather than a centralized database. Clearing browser data may result in data loss, and records are not synchronized across devices.

## Running the Application

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm start
```

The application will typically be available at `http://localhost:3000`.

## Screenshots

### Dashboard
Shows attendance summaries and charts for the selected date range.

<img width="1909" height="952" alt="image" src="https://github.com/user-attachments/assets/65dfda44-458f-4c06-9212-cd9b0e2611ee" />
<img width="1912" height="561" alt="image" src="https://github.com/user-attachments/assets/c7a366e5-ac41-4e46-a69a-cb91bc766e13" />


### Attendance
Displays daily attendance records and provides date filtering and CSV export.

<img width="1894" height="946" alt="image" src="https://github.com/user-attachments/assets/49eda9ac-d136-4105-a6a1-b4c1ba5bc082" />


### Players
Provides access to the player list and individual profiles.

<img width="1905" height="950" alt="image" src="https://github.com/user-attachments/assets/3507bed6-9c5b-433a-bc00-185f9bc075a7" />


### Player Profile
Shows an individual player's attendance history and statistics.

<img width="1900" height="940" alt="image" src="https://github.com/user-attachments/assets/ba0b8b4a-e792-480c-8e77-2d2d83ec6e02" />


### CSV Imports
Supports CSV uploads, column mapping, data previews, and import history.

<img width="1913" height="945" alt="image" src="https://github.com/user-attachments/assets/6952ee40-d795-4124-8276-fa01ba049e96" />
