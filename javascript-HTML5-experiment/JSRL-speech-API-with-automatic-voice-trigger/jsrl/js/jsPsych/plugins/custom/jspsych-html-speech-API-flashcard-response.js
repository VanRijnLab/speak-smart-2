/**
 * jspsych-html-speech-API-response
 * Thomas Wilschut
 *
 * Plugin for displaying a written L2 cue, requesting a voice reponse, automatic speech-to-text
 * transciription, and answer scoring. Based on Web Speech API speech to text technology.
 * 
 * NB: works best in chrome webbrowser
 * 
 *
 **/


jsPsych.plugins["html-speech-API-flashcard-response"] = (function () {

    var plugin = {};

    plugin.info = {
        name: "html-speech-API-response",
        parameters: {
            newQuestion: {
                type: jsPsych.plugins.parameterType.OBJECT,
                pretty_name: 'Question',
                default: null,
                description: 'Question object'
            },
            voice_key_trigger: {
                type: jsPsych.plugins.parameterType.OBJECT,
                pretty_name: 'Voice key trigger',
                default: null,
                description: 'Voice key trigger settings'
            },
            feedback_controller: {
                type: jsPsych.plugins.parameterType.OBJECT,
                pretty_name: 'Feedback controller',
                default: null,
                description: 'Feedback controller settings'
            },
            prompt: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Prompt',
                default: null,
                description: 'Any content here will be displayed above the stimulus.'
            },
            stimulus_duration: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Stimulus duration',
                default: null,
                description: 'How long to hide the stimulus.'
            },
            trial_duration: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Trial duration',
                default: null,
                description: 'How long to show trial before it ends.'
            },
            show_feedback: {
                type: jsPsych.plugins.parameterType.BOOL,
                pretty_name: 'Show feedback',
                default: true,
                description: 'Show feedback after an answer is given.'
            },
            correct_feedback_duration: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Correct feedback duration',
                default: 200,
                description: 'The length of time in milliseconds to show the feedback when the answer is correct.'
            },
            incorrect_feedback_duration: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Incorrect feedback duration',
                default: 200,
                description: 'The length of time in milliseconds to show the feedback when the answer is incorrect.'
            },
            voice_key_delay: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Voice key delay',
                default: 0,
                description: 'The length of time in milliseconds between the onset of a sound and the voice key trigger.'
            },
            language: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Language',
                default: null,
                description: 'The predefined user language'
            },
            end_trial_key: {
                type: jsPsych.plugins.parameterType.KEYCODE,
                pretty_name: 'End trial key',
                default: 13, // ENTER key
                description: 'The key that finalises the response.'
            }
    
        
            

        }
    };


    plugin.trial = function (display_element, trial) {

        // set the default listening screen
        var new_html = '';
        var picture = "url('./res/listening.png')"

        if (trial.newQuestion.studied = "undefined") {
            trial.newQuestion.studied = false;
        } 
       
        // show the prompt
        if (trial.prompt !== null) {
            new_html += '<p>' + trial.prompt + '<p>';
        }
        
        new_html += '<div id="jspsych-html-keyboard-word-response-stimulus">';

        // show the stimulus
        if (trial.newQuestion.length != 'undefined') { // was: trial.question.dir.length > 0
            new_html +=  trial.newQuestion.question.innerHTML;
        } else {
            new_html += trial.newQuestion.text.innerHTML;
        }

        new_html += '</div><div></div>';

        
        if (responses.some(response => response.id === trial.newQuestion.id.innerHTML)) {
            hint = [];    
        } else {   
            if (trial.newQuestion.test) {
                hint = [];
            }
            else 
            hint = '<p>' + trial.newQuestion.answer.innerHTML + '<p>';
        }
    

        new_html += hint;


    

        // add disabled text input
        new_html += '<input text id="jspsych-html-voicekey-response-answerInput" type="text" \
        autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" disabled="true"/>'

        // add div for feedback
        new_html += '<div id="jspsych-html-voicekey-response-feedback"><p></br></p></div>'


        // draw
        display_element.innerHTML = new_html;
        display_element.querySelector("#jspsych-html-voicekey-response-answerInput").style.backgroundImage = picture; 
    
        // record start time
        var presentation_start_time = Date.now();

        // store responses in variables:
        var rt = Infinity;                  // response time 
        var correct = null;                 // correctness, binary: either true or false 
        var response_time_out;              // did the participant think longer than the permissible timeout?
        var timed_out = false;  
        var final_response = [];                   
   
        // speech API:
    
        var voice_key_triggered = false;    // is the voice key triggered (this happens automatically upon speech start)
        var speech_has_started = false;     // did the speech start?
        var speech_has_ended = false;       // did the speech end?
        var command = null;                 // command will contain the transcibed voice sting 
        var confidence =  null;             // how confident is the API about this transcirption?
        var full_results = null;            // contains all possible data from the API for the current request

        var check_interval = null;          // to check for results, see below 

        var first_attempt_failed = false;   // did the API succesflly return a result, for the first speech utterance?
        var result_returned = false;
        var message = document.querySelector('#message');  // show the result sting directly in the HTML (for developing purposes)
        
        // import grammer 
        var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
        var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
        var grammar = '#JSGF V1.0;'

        // set recogntition parameters 
        var recognition = new SpeechRecognition();
        var speechRecognitionList = new SpeechGrammarList();
        speechRecognitionList.addFromString(grammar, 1);
        recognition.grammars = speechRecognitionList;
        recognition.lang = 'en-UK';
        recognition.interimResults = false;

        // function that will be called whenever a speech start signal is detected. 
        recognition.onspeechstart = function(info) {
            speech_has_started = true;
            voice_key_triggered = true;       
            start_speak_time = Date.now()        
            picture = "url('./res/detected.png')"   
            display_element.querySelector("#jspsych-html-voicekey-response-answerInput").style.backgroundImage = picture; 
            rt = get_reaction_time(start_speak_time - presentation_start_time)
            console.log('Participant started speaking; (RT = ' + rt + ')')  
        } 

        // function that will be called automatically when speech has stopped 
        recognition.onspeechend = function() {
            console.log('Participant has stopped speaking, sending audio to API...');
            speech_has_ended = true;  
            API_sent_time = Date.now(); // register the timepoint at which the audio was sent to the API
            start_check_API(); // start to check if a valid result was returned. If not, restart recognition procedure

        }

        // function that will be called whenever a result is received from the speech API
        recognition.onresult = function(event) {
            var last = event.results.length - 1;
            command = event.results[last][0].transcript;
            message.textContent =  command ;
            console.log('Result succesfully received! Participant spoke: ' + command + '; conf = ' + event.results[0][0].confidence);
            full_results = event.results
            result_returned = true;
            clearInterval(check_interval)   // stop the check procedure
            show_feedback();                // show feedback
        };  

        // start recognition process!   
        recognition.start();
        var recognizing = false;

        recognition.onstart = function () {
            recognizing = true;
        };
        
        recognition.onend = function () {
            recognizing = false;
        };
        
        recognition.onerror = function (event) {
            recognizing = false;
        };


        recognition.onerror = function(event) {

            // if no input speech is detected, try the recogntion process again:
            console.log('Speech recognition error detected: ' + event.error);
            
            var voice_key_triggered = false;    // is the voice key triggered (this happens automatically upon speech start)
            var speech_has_started = false;     // did the speech start?
            var speech_has_ended = false;       // did the speech end?
            var command = null;                 // command will contain the transcibed voice sting 
            var check_interval = null;          // to check for results, see below
            var message = document.querySelector('#message');  // show the result sting directly in the HTML (for developing purposes)
            
            // import grammer 
            var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
            var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
            var grammar = '#JSGF V1.0;'
    
            // set recogntition parameters 
            var recognition = new SpeechRecognition();
            var speechRecognitionList = new SpeechGrammarList();
            speechRecognitionList.addFromString(grammar, 1);
            recognition.grammars = speechRecognitionList;
            recognition.lang = 'en-US';
            recognition.interimResults = false;
    
            // function that will be called whenever a speech start signal is detected. 
            recognition.onspeechstart = function(info) {
                speech_has_started = true;
                voice_key_triggered = true;       
                start_speak_time = Date.now()        
                picture = "url('./res/detected.png')"   
                display_element.querySelector("#jspsych-html-voicekey-response-answerInput").style.backgroundImage = picture; 
                rt = get_reaction_time(start_speak_time - presentation_start_time)
                console.log('Participant started speaking; (RT = ' + rt + ')')  
            }
    
            // function that will be called automatically when speech has stopped 
            recognition.onspeechend = function() {
                console.log('Participant has stopped speaking, sending audio to API...');
                speech_has_ended = true;  
                API_sent_time = Date.now(); // register the timepoint at which the audio was sent to the API
                start_check_API(); // start to check if a valid result was returned. If not, restart recognition procedure
            }
    
            // function that will be called whenever a result is received from the speech API
            recognition.onresult = function(event) {
                var last = event.results.length - 1;
                command = event.results[last][0].transcript;
                message.textContent =  command ;
                console.log('Result succesfully received! Participant spoke: ' + command + '; conf = ' + event.results[0][0].confidence);
                full_results = event.results
                result_returned = true;
                clearInterval(check_interval)   // stop the check procedure
                show_feedback();                // show feedback
            };  

            recognition.start();
        
        }


        // function to check if a valid result was returned after the participant stopped speaking 
        var check_API_timeout = function () {
            if ((!result_returned) && (voice_key_triggered) && (!recognizing)) {
            //console.log(command)
            console.log('no response found')
            txt = 'I did not understand. Say again?'
            display_element.querySelector("#jspsych-html-voicekey-response-feedback").innerHTML = txt
            picture = "url('./res/listening.png')"
            display_element.querySelector("#jspsych-html-voicekey-response-answerInput").style.backgroundImage = picture; 
            recognition.start();
            first_attempt_failed = true;
            }
        }
        
        // after speech has stopped, check for a result every 4 seconds:
       var start_check_API = function () {
           //console.log(result_returned)
           check_interval = window.setInterval(function(){
           check_API_timeout();
           }, 4000);
        }

        
        // show feedback about the final response to the participant
        var show_feedback = function () {

            compute_correctness();

            display_element.querySelector("#jspsych-html-voicekey-response-answerInput").disabled = true;
            document.querySelector("#jspsych-html-voicekey-response-answerInput").style.backgroundImage = ""; 
            display_element.querySelector("#jspsych-html-voicekey-response-answerInput").value = final_response;

        
                if (correct) {
                    feedback = '<p> Correct! You spoke: <b>' + document.querySelector('#message').innerHTML + '.</p>';
                } else if (timed_out) {
                    feedback = '<p> Too slow... The correct answer was: <b>' + trial.newQuestion.answer.innerHTML + '</b></p>';
                    start_speak_time = 0;
                    end_speak_time = 0;
                } else {
                    feedback = '<p> Incorrect! You spoke: <b>' + document.querySelector('#message').innerHTML + '</b>. The correct answer was: <b>' + trial.newQuestion.answer.innerHTML  +  '</b></p>', new Audio(trial.newQuestion.dir).play();
                } 
                  

            display_element.querySelector("#jspsych-html-voicekey-response-feedback").innerHTML = feedback

            jsPsych.pluginAPI.setTimeout(end_trial, correct ? trial.correct_feedback_duration : trial.incorrect_feedback_duration);

        }

        var continue_without_feedback = function () {
            display_element.querySelector("#jspsych-html-voicekey-response-answerInput").disabled = true;
            document.querySelector("#jspsych-html-voicekey-response-answerInput").style.backgroundImage = ""; 
            display_element.querySelector("#jspsych-html-voicekey-response-answerInput").value = final_response;

            jsPsych.pluginAPI.setTimeout(end_trial, 1000);

        }

        var prepare_feedback = function () {
            if (typeof response_time_out !== "undefined") {
                clearTimeout(response_time_out);
            }

            if (trial.show_feedback) {
                show_feedback();
            } else {
                continue_without_feedback();
            }
        }

        // function to end trial when it is time
        var end_trial = function () {

            // kill any remaining setTimeout handlers
            jsPsych.pluginAPI.clearAllTimeouts();

            // kill gamepad listeners
            if (typeof gamepadListener !== 'undefined') {
                cancelGamepadResponse(gamepadListener);
            }

            // gather the data to store for the trial
            var trial_data = {
                "presentation_start_time": presentation_start_time,
                "id": trial.newQuestion.id.innerHTML,        
                "text": trial.newQuestion.text.innerHTML, 
                "response": final_response,
                "rt": rt,
                "answer": trial.newQuestion.answer.innerHTML, 
                "correct": correct, 
                "start_speak_time": start_speak_time,
                "end_speak_time": end_speak_time,
                "reading_time": trial.newQuestion.log_reading_time,
                "estimated_rt": trial.newQuestion.log_estimated_rt,
                "transcribed speech signal response": command,
                "confidence" : confidence,
                "full results": full_results
            };

            // clear the display
            display_element.innerHTML = '';

            // move on to the next trial
            jsPsych.finishTrial(trial_data);
        };

        // function to get reaction time (never below 100 ms)
        var get_reaction_time = function (rt) {
            reaction_time = rt
            return Math.max(reaction_time, 100);
        }

        // function to check if a response is correct
        var compute_correctness = function () {

            if (document.querySelector('#message').innerHTML.toLowerCase() === trial.newQuestion.answer.innerHTML) {
                correct = true;
                console.log('Answer is correct')
                end_speak_time = Date.now();
                //final_response = is_response_correct(document.querySelector('#message').innerHTML)

            } else {
                correct = false;
                attempt =  false;
                console.log('Answer is incorrect')
                end_speak_time = Date.now();
               // final_response = is_response_correct(document.querySelector('#message').innerHTML)
            }

        } 
        
        var is_response_correct = function () {
            return final_response.localeCompare(trial.newQuestion.answer.innerHTML, 'en', {sensitivity: "accent"}) === 0;
        }

        // hide stimulus if stimulus_duration is set
        if (trial.stimulus_duration !== null) {
            jsPsych.pluginAPI.setTimeout(function () {
                display_element.querySelector('#jspsych-html-voicekey-response-stimulus').style.visibility = 'hidden';
            }, trial.stimulus_duration);
        }

        // end trial if trial_duration is set
        if (trial.trial_duration !== null) {
            response_time_out = jsPsych.pluginAPI.setTimeout(function () {
                timed_out = true;
                rt = Infinity;
                correct = false;
                prepare_feedback();
            }, trial.trial_duration);
        }

    };

    return plugin;
    
})();
