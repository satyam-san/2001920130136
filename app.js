const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Replace these values with the ones received after registering your company
const COMPANY_NAME = 'Train Central';
const CLIENT_ID = 'b46118f0-fbde-4b16-a4b1-6ae6ad718b27';
const CLIENT_SECRET = 'XOyo10RPasKWODAN';

// Function to get the authorization token from the John Doe Railway Server
async function getAuthorizationToken() {
  try {
    const response = await axios.post('http://20.244.56.144/train/auth', {
      companyName: COMPANY_NAME,
      clientID: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
    });

    return response.data.access_token;
  } catch (error) {
    console.error(error.response.data);
    throw new Error('Failed to obtain authorization token');
  }
}

// Function to fetch train details from the John Doe Railway Server
async function fetchTrains(token) {
  try {
    const response = await axios.get('http://20.244.56.144/train/trains', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error(error.response.data);
    throw new Error('Failed to fetch train details');
  }
}

// Function to filter and format train data
function filterTrains(trains) {
  const currentTime = new Date();
  const next12Hours = new Date(currentTime.getTime() + 12 * 60 * 60 * 1000);

  return trains.filter((train) => {
    const departureTime = new Date(train.departureTime.Hours, train.departureTime.Minutes);
    return departureTime > currentTime && departureTime <= next12Hours;
  }).map((train) => ({
    trainName: train.trainName,
    trainNumber: train.trainNumber,
    departureTime: train.departureTime,
    seatsAvailable: train.seatsAvailable,
    price: train.price,
    delayedBy: train.delayedBy,
  })).sort((a, b) => {
    if (a.price.AC !== b.price.AC) {
      return a.price.AC - b.price.AC;
    } else if (a.seatsAvailable.AC !== b.seatsAvailable.AC) {
      return b.seatsAvailable.AC - a.seatsAvailable.AC;
    } else {
      const aDepartureTime = new Date(a.departureTime.Hours, a.departureTime.Minutes);
      const bDepartureTime = new Date(b.departureTime.Hours, b.departureTime.Minutes);
      return bDepartureTime - aDepartureTime;
    }
  });
}

// Route to get all trains in the next 12 hours with seat availability & pricing
app.get('/trains', async (req, res) => {
  try {
    const token = await getAuthorizationToken();
    const trains = await fetchTrains(token);
    const filteredTrains = filterTrains(trains);

    res.json(filteredTrains);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Serve the index.html page
app.get('/train/trains', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  res.sendFile(indexPath);
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
