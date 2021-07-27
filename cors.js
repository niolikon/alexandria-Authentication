const express = require('express');
const cors = require('cors');
const app = express();

// This enlists all the origins that this server is willing to accept
var whitelist = ['http://localhost:3000', 'http://localhost:3001', 
                 'http://localhost:8280', 'http://localhost:8380',
                 'http://localhost:3100', 'http://localhost:3200'];

// Here we will configure the corsOptions
const corsOptionsDelegate = (req, callback) => {
    let corsOptions;
    console.log('Origin:', req.header('Origin'));
    // If the incoming request has the Origin field we will check if 
    // the related address is present in the whitelist
    if(whitelist.indexOf(req.header('Origin')) !== -1) {
        // Here we are allowing the Origin to be accepted
        corsOptions = { origin: true };
    }
    else {
        // The CORS allowOrigin will not be returned by my server side
        corsOptions = { origin: false };
        // We can also prevent ANY operation in case the Origin is 
        // not in the whitelist with a call to callback:
        
        // Es: callback(new Error('Not allowed by CORS'));
    }
    callback(null, corsOptions);
};

exports.cors = cors();
exports.corsWithOptions = cors(corsOptionsDelegate);