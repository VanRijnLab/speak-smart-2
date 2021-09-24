/**
 * jspsych-html-speech-API-response
 * Thomas Wilschut
 *
 * Plugin for displaying a written L2 cue, requesting a voice reponse, automatic speech-to-text
 * transciription, and answer scoring. Based on Web Speech API speech to text technology.
 * 
 * NB: works best in chrome of firefox webbrowsers
 * 
 *
 **/


jsPsych.plugins["html-speech-API-response"] = (function () {

    var plugin = {};

    plugin.info = {
        name: "html-speech-API-response",
        parameters: {
            question: {
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
            voice_trigger_key: {
                type: jsPsych.plugins.parameterType.KEYCODE,
                pretty_name: 'End trial key',
                default: 32, // spacebar
                description: 'The key that finalises the response.'
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
            types: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'trial type',
                default: 'filler',
                description: 'Type of trial: study, test or other'
            },
            block: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'block',
                default: 'F',
                description: 'block'
            },
            language: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Language',
                default: null,
                description: 'The predefined user language'
            }
            

        }
    };


    plugin.trial = function (display_element, trial) {

        var new_html = '';
        var picture = "url('./res/listening.png')"

        // show the prompt
        if (trial.prompt !== null) {
            new_html += '<p>' + trial.prompt +'<p>';
        }

        new_html += '<div id="jspsych-html-voicekey-response-stimulus">';

        // show the stimulus
        if (trial.question.id.length > 0) { 
            new_html +=  trial.question.question;
        } else {
            new_html += trial.question.text;
        }

        new_html += '</div><div></div>';

        // show the answer if it's a study trial
        hint = '<p id="jspsych-html-voicekey-response-hint"></br></p>';
        if (trial.question.study) {
            hint =  '<p>' + trial.question.answer + '</p>', new Audio(trial.question.dir).play();
            ;
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
        var rt = Infinity;
        var final_response = "";
        var correct = null;
        var response_time_out;
        var timed_out = false;
        var attempt = null;
        
        var voice_key_triggered = false;
        var experimenter_rt = Infinity;

        // speech API

        var message = document.querySelector('#message');
        
        var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
        var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
        
        var grammar = '#JSGF V1.0;'

        var recognition = new SpeechRecognition();
        var speechRecognitionList = new SpeechGrammarList();
        speechRecognitionList.addFromString(grammar, 1);
        recognition.grammars = speechRecognitionList;
        recognition.lang = 'en-UK';
        recognition.interimResults = false;

        recognition.onspeechend = function() {
            console.log('Participant has stopped speaking, sending audio to API...');
        }

        recognition.onresult = function(event) {
            var last = event.results.length - 1;
            var command = event.results[last][0].transcript;
            message.textContent =  command ;
            console.log('Result succesfully received! Participant spoke: ' + command)

            show_feedback();
        };  
        


        // show feedback about the final response to the participant
        var show_feedback = function () {

            compute_correctness();

            display_element.querySelector("#jspsych-html-voicekey-response-answerInput").disabled = true;
            document.querySelector("#jspsych-html-voicekey-response-answerInput").style.backgroundImage = ""; 
            display_element.querySelector("#jspsych-html-voicekey-response-answerInput").value = final_response;

        
                if (correct) {
                    feedback = '<p> Correct! You spoke: <b>' + document.querySelector('#message').innerHTML + '.</p>';
                } else if (timed_out) {
                    feedback = '<p> Too slow... The correct answer was: <b>' + trial.question.answer + '</b></p>';
                    start_speak_time = 0;
                    end_speak_time = 0;
                } else {
                    feedback = '<p> Incorrect! You spoke: <b>' + document.querySelector('#message').innerHTML + '</b>. The correct answer was: <b>' + trial.question.answer  +  '</b></p>', new Audio(trial.question.dir).play();
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
                "id": trial.question.id,        
                "text": trial.question.text, 
                "response": final_response,
                "rt": get_reaction_time(),
                "keypresses": JSON.stringify([]),
                "answer": trial.question.answer, 
                "correct": correct, 
                "study": trial.question.study,
                "experimenter_rt": experimenter_rt,
                "activation": question.log_fact_activations,
                "alpha": question.log_fact_alpha,
                "mu":trial.question.mu,
                "kappa": trial.question.kappa,
                "a":trial.question.a,
                "b":trial.question.b,
                "start_speak_time": start_speak_time,
                "end_speak_time": end_speak_time,
                "types": trial.types,
                "block": trial.block,
                "reading_time": trial.question.log_reading_time,
                "estimated_rt": trial.question.log_estimated_rt,
                "attempt": attempt
            };

            // clear the display
            display_element.innerHTML = '';

            // move on to the next trial
            jsPsych.finishTrial(trial_data);
        };

        var get_reaction_time = function () {
            // Account for voice key delay
            reaction_time = rt - voice_key_delay;

            // RT should be at least 100 ms
            return Math.max(reaction_time, 100);
        }


        // function to handle responses by the subject
        var after_response = function (info) {
        
            // register voice key response
            //if (info.id.indexOf(trial.voice_key_trigger.id) !== -1) {
                if (!voice_key_triggered & info.key === 32) {
                    voice_key_triggered = true;
                    rt = info.rt;
                    start_speak_time = Date.now()
                    picture = "url('./res/detected.png')"
                    display_element.querySelector("#jspsych-html-voicekey-response-answerInput").style.backgroundImage = picture; 
                    recognition.start()
                    console.log('Listening...' )
                } 
                
                
            //}

        }

        var compute_correctness = function () {

            if (document.querySelector('#message').innerHTML === trial.question.answer) {
                    correct = true;
                    console.log('Answer is correct')
                    //trial.newQuestion.studied = true;
                    end_speak_time = Date.now();
                    final_response = []; 
                    experimenter_input_registered = true;
                    //experimenter_rt = info.rt;
                    attempt = true;

            } else {
                    correct = false;
                    attempt =  false;
                    console.log('Answer is incorrect')
                    //trial.newQuestion.studied = true;
                    end_speak_time = Date.now();
                    experimenter_input_registered = true;
                    //experimenter_rt = info.rt;
            }

        } 

        // start response listener
        if (trial.choices != jsPsych.NO_KEYS) {
            var keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
                callback_function: after_response,
                valid_responses: trial.choices,
                persist: true,
                allow_held_key: true,
                prevent_default: false,
                rt_method: "performance",
            });
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
