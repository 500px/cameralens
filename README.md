Camera/Lens Data Analysis Prototype
============

Basic prototype for analyzing and refining EXIF data in photos. Used on data in the 500px website.  

### What does it do?

This simple node.js application is a proof of concept for a potential application for EXIF data on 500px. A basic sample of the data is provided in `data_sample.csv`. Cluster analysis of the data has been performed using OpenRefine to clean up the messy data, and a basic dictionary for correcting all the messy data has been created in `refine_cluster.json`. After clustering the data, basic stats on the data can be shown such as top cameras used on 500px, top lenses used for each camera, top photos for each camera or camera/lens combination, and popular focal lengths used for a camera/lens combination. 

### Why did we make this?

This project was a hack for the monthly company hackday. 

### How do I use this?

1. Clone this repository: `git clone https://github.com/amsardesai/cameralens.git .`
2. Install all dependencies: `npm install`
3. Make a `data` directory: `mkdir data`
4. Run `mongod` in another terminal: `mongod --dbpath=data --port=27020`
5. Run the import script to import the data sample to the mongo database (this will take a while): `node import.js`
6. Start the server: `npm start`
7. Go to `localhost:3000` on your browser
