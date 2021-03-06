/**
 * jspsych-html-keyboard-word-response
 * Maarten van der Velde
 *
 * Plugin for displaying a stimulus and getting the full sequence of characters in the keyboard response.
 * Based on the jspsych-html-keyboard-response plugin.
 * 
 *
 **/


jsPsych.plugins["html-keyboard-word-response"] = (function () {

    var plugin = {};

    plugin.info = {
        name: "html-keyboard-word-response",
        parameters: {
            question: {
                type: jsPsych.plugins.parameterType.OBJECT,
                pretty_name: 'Question',
                default: null,
                description: 'Question object'
            },
            choices: {
                type: jsPsych.plugins.parameterType.KEYCODE,
                array: true,
                pretty_name: 'Choices',
                default: jsPsych.ALL_KEYS,
                description: 'The keys the subject is allowed to press to respond to the stimulus.'
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
            end_trial_key: {
                type: jsPsych.plugins.parameterType.KEYCODE,
                pretty_name: 'End trial key',
                default: 13, // ENTER key
                description: 'The key that finalises the response.'
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
            require_capitalisation: {
                type: jsPsych.plugins.parameterType.BOOL,
                pretty_name: 'Require capitalisation',
                default: false,
                description: 'Require correct capitalisation of the answer.'
            },
            language: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Language',
                default: null,
                description: 'The predefined user language'

            },
            block: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'block',
                default: 'F',
                description: 'block'

            },
            types: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Trial type',
                default: 'filler',
                description: 'The type of trial, other, study or test'

            }
        }
    };


    plugin.trial = function (display_element, trial) {
        
        var new_html = '';
        
        // show the prompt
        if (trial.prompt !== null) {
            new_html += '<p>' + trial.prompt + '<p>';
        }
        
        new_html += '<div id="jspsych-html-keyboard-word-response-stimulus">';

        // show the stimulus
        if (trial.question.answer.length > 0) {
            new_html +=  trial.question.question;
        } else {
            new_html += trial.question.text;
        }

        new_html += '</div><div></div>';

        // show the answer if it's a study trial
        // hint = '<div id="jspsych-html-keyboard-word-response-stimulus">';
        if (trial.question.stud) {
            hint = '<p>' + trial.question.answer + '</p>';
        } else {
            hint = '<p>'+ trial.question.text + '<p>';
        }

        new_html += hint;
    


        // add text input
        new_html += '<input text id="jspsych-html-keyboard-word-response-answerInput" type="text" \
        autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />'

        // add div for feedback
        new_html += '<div id="jspsych-html-keyboard-word-response-feedback"><p></br></p></div>'

        // draw
        display_element.innerHTML = new_html;

        // record start time
        var presentation_start_time = Date.now();

        // focus on text input
        display_element.querySelector("#jspsych-html-keyboard-word-response-answerInput").focus();

        // store all keypresses
        var responses = [];
        var final_response = "";
        var correct = null;
        var backspace_used = false;
        var backspaced_first_letter = false;
        var response_time_out;
        var timed_out = false;

        // show feedback about the final response to the participant
        var show_feedback = function () {
            if (typeof response_time_out !== "undefined") {
                clearTimeout(response_time_out);
            }

            display_element.querySelector("#jspsych-html-keyboard-word-response-answerInput").disabled = true;
            display_element.querySelector("#jspsych-html-keyboard-word-response-answerInput").value = final_response;

                if (correct) {
                    feedback = '<p>Correct!</p>';
                } else if (timed_out) {
                    feedback = '<p>Too slow... the correct answer was: <b>' + trial.question.answer + '</b></p>';
                } else {
                    feedback = '<p> Wrong! The correct answer was: <b>' + trial.question.answer + '  ' + trial.question.exp + '</b></p>';
                }
            

        
            
            display_element.querySelector("#jspsych-html-keyboard-word-response-feedback").innerHTML = feedback;

            jsPsych.pluginAPI.setTimeout(end_trial, correct ? trial.correct_feedback_duration : trial.incorrect_feedback_duration);

        }

        // End trial without feedback
        var continue_without_feedback = function () {
            display_element.querySelector("#jspsych-html-keyboard-word-response-answerInput").disabled = true;
            display_element.querySelector("#jspsych-html-keyboard-word-response-answerInput").value = final_response;

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

            // kill keyboard listeners
            if (typeof keyboardListener !== 'undefined') {
                jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
            }

            // gather the data to store for the trial
            var trial_data = {
                "presentation_start_time": presentation_start_time,
                "id": trial.question.id,
                "text": trial.question.text,
                "response": final_response,
                "rt": get_reaction_time(),
                "keypresses": JSON.stringify(responses),
                "answer": trial.question.answer,
                "correct": correct,
                "study": trial.question.study,
                "backspace_used": backspace_used,
                "backspaced_first_letter": backspaced_first_letter,
                "activation": question.log_fact_activations,
                "alpha": question.log_fact_alpha,
                "mu":trial.question.mu,
                "kappa": trial.question.kappa,
                "a":trial.question.a,
                "b":trial.question.b,
                "types": trial.types,
                "block": trial.block,
                "reading_time": trial.question.log_reading_time,
                "estimated_rt": trial.question.log_estimated_rt
            };

            // clear the display
            display_element.innerHTML = '';

            // move on to the next trial
            jsPsych.finishTrial(trial_data);
        };

        var get_reaction_time = function () {
            return backspaced_first_letter ? Infinity : responses[0].rt;
        }

        var is_response_correct = function () {
            if (!trial.require_capitalisation) {
                // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare
                return final_response.localeCompare(trial.question.answer, 'en', {sensitivity: "accent"}) === 0;
            }
            return final_response == trial.question.answer;
        }

        // function to handle responses by the subject
        var after_response = function (info) {

            pressed_key = jsPsych.pluginAPI.convertKeyCodeToKeyCharacter(info.key);

            responses.push({
                key_press: pressed_key,
                rt: info.rt,
            });

            // after a valid response, the stimulus will have the CSS class 'responded'
            // which can be used to provide visual feedback that a response was recorded
            display_element.querySelector('#jspsych-html-keyboard-word-response-stimulus').className += ' responded';

            // handle backspace key press
            if (info.key === 8) {
                backspace_used = true;

                // if the first letter is going to be erased, the RT is no longer useable
                if (display_element.querySelector('#jspsych-html-keyboard-word-response-answerInput').value.length <= 1) {
                    backspaced_first_letter = true;
                }
            }

            if (info.key === trial.end_trial_key) {
                final_response = display_element.querySelector('#jspsych-html-keyboard-word-response-answerInput').value;
                correct = is_response_correct();
                prepare_feedback();
            }
        };

        // start the response listener
        if (trial.choices != jsPsych.NO_KEYS) {
            var keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
                callback_function: after_response,
                valid_responses: trial.choices,
                persist: true,
                allow_held_key: true,
                prevent_default: false,
                rt_method: "performance"
            });
        }

        // hide stimulus if stimulus_duration is set
        if (trial.stimulus_duration !== null) {
            jsPsych.pluginAPI.setTimeout(function () {
                display_element.querySelector('#jspsych-html-keyboard-word-response-stimulus').style.visibility = 'hidden';
            }, trial.stimulus_duration);
        }

        // end trial if trial_duration is set
        if (trial.trial_duration !== null) {
            response_time_out = jsPsych.pluginAPI.setTimeout(function () {
                timed_out = true;
                responses.push({
                    key_press: null,
                    rt: Infinity,
                });
                prepare_feedback();
            }, trial.trial_duration);
        }

    };

    return plugin;
})();
