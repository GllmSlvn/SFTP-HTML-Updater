# SFTP HTML Updater

This project is a Node.js application designed to receive data via a POST API, convert the data into two HTML files (French and English), and upload these files to a remote SFTP server. It also updates metadata for existing files on the SFTP server.

## Features

- Receives JSON data through a POST endpoint.
- Converts data into `data_calendrier.html` (French) and `data_calendar.html` (English).
- Uploads the generated HTML files to an SFTP server.
- Updates metadata for specific files on the SFTP server.
- Logs all activities, including received data and upload status, into a log file.

## Prerequisites

Ensure the following are installed on your system:

- [Node.js](https://nodejs.org/) (version 14 or later recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- Access to a valid SFTP server

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/sftp-html-updater.git
   cd sftp-html-updater
