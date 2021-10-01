var fact1 = {id: "1", eng:"albeit", pron: "awl-bee-it,res", dir:"res/audio/albeit.mp3", correctlyanswerd: false, text: ""}
var fact2 = {id: "2", eng:"analysis", pron: "uh-nal-uh-sis", dir:"res/audio/analysis.mp3",correctlyanswerd: false,text: ""}
var fact3 = {id: "3", eng:"applicable", pron: "ap-li-kuh-buhl", dir:"res/audio/applicable.mp3",correctlyanswerd: false,text: ""}
var fact4 = {id: "4", eng:"arctic", pron: "ahrk-tik", dir:"es/audio/arctic.mp3",correctlyanswerd: false,text: ""}
var fact5 = {id: "5", eng:"awry", pron: "uh-rahy", dir:"res/audio/awry",correctlyanswerd: false,text: ""}
var fact6 = {id: "6", eng:"bonhomie", pron: "bon-uh-mee", dir:"res/audio/bonhomie.mp3",correctlyanswerd: false,text: ""}
var fact7 = {id: "7", eng:"brobdingnagian", pron: "brob-ding-nag-ee-uhn", dir:"res/audio/brobdingnagian.mp3",correctlyanswerd: false,text: ""}
var fact8 = {id: "8", eng:"bury", pron: "ber-ee", dir:"res/audio/bury.mp3",correctlyanswerd: false,text: ""}
var fact9 = {id: "9", eng:"choir", pron: "kwahy-uhr", dir:"choir.mp3",correctlyanswerd: false,text: ""}
var fact10 = {id: "10", eng:"chutzpah", pron: "hoot-spuh", dir:"res/audio/chutzpah.mp3",correctlyanswerd: false,text: ""}

var fact_names = ["fact1", "fact2", "fact3", "fact4", "fact5", "fact6", "fact7", "fact8", "fact9", "fact10"]

function record_response(data, log_fact = false) {
    responses.push(data);

    // If this is the third response for a fact, inform the server
    const responses_for_fact = responses.filter(response => response.id == data.id);
    if (responses_for_fact.length == 3 && log_fact) {
        send_fact_file_to_server(data.id, null);
    }

}

function send_fact_file_to_server(id, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'post-fact-observation.php');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function () {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            if (callback) callback();
        }
    }
    xhr.send(JSON.stringify({ filename: id + "_" + subject_id, filedata: {} }));

}


function get_next_flashcard (correct, count_studied_B) {
  
    if (previous_item_index == "undefined") {
        previous_item_index = -1
    }

    next_item_index = previous_item_index + 1 

    if (next_item_index > count_studied_B) {
        next_item_index = 1
    }

    currentfact = fact_names[next_item_index]

    while (currentfact.correctlyanswerd) {
        next_item_index++
    }

    question = currentfact

    if (button === feedback_controller.button_correct) {
        correct = true;
    }

    if (button === feedback_controller.button_incorrect) {
        correct = false;
    }

  
    if (!correct) {
        currentfact.correctlyanswerd = false
    } else {
        currentfact.correctlyanswerd = true
    }
    
    return question
}


