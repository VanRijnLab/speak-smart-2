# jsrl - German Cities

Javascript implementation of RUGged Learning for studying the locations of famous German landmarks using a voice key.
Requires a voice key trigger box and a gamepad device used by the experimenter to classify responses.


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

[localhost:8080/index.html](localhost:8080/index_B&C.html)
[localhost:8080/index.html](localhost:8080/index_A.html)

### Troubleshooting

Setup options can be changed at the top of the `index.html` file.

To check which gamepad devices are connected, go to [localhost:8080/voicekey-test.html](localhost:8080/voicekey-test.html).