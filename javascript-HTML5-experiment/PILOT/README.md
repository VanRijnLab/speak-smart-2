# jsrl - PILOT SPEECH API and automatic voice key trigger 

Pilot version: asks participants to pronunce English words three times. At first presentation, the correct pronunciaiton is given. 
No feedback is provided.

Javascript implementation of RUGged Learning for studying swahili vocabulary, using automaic speech assessment and voice key.
Works best in Chrome. Requires a microphone and headphones. 


## Usage

### Run on a local php server:

    cd jsrl && php -S localhost:8080


### Run in Docker:

Docker needs to be given ownership of the data folder (only once) [(details)](https://stackoverflow.com/questions/3740152/how-do-i-set-chmod-for-a-folder-and-all-of-its-subfolders-and-files):

    sudo chown -R 33:33 jsrl/data

(Depending on the system's permissions setup, read access may also need to be given for the whole directory.)

Launch the server:

    sudo docker-compose up


### Run the experiment

[localhost:8080/index.html](localhost:8080/index.html)


### Troubleshooting

Setup options can be changed at the top of the `index.html` file.`

