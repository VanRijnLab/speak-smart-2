# jsrl - SPEECH API and automatic voice key trigger 

Javascript implementation of RUGged Learning for studying swahili vocabulary, using automaic speech assessment and voice key.
Works best in Chrome. Requires a microphone and headphones. 


## Usage

    To select a condition, change 'cond' in the index.html file:

    cond 1 'typing':        RT-adptive typing --> Leitner-adaptive typing 
    cond 2 'speaking':      RT-adaptive speaking --> Leitner-adaptive speaking 

    Various paraneters can be set in the index.html file.

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

