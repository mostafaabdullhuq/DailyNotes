const { ipcRenderer } = require("electron");
const niceScroll = require("jquery.nicescroll"),
    database = require("electron-db");
let myScroll,
    searchInput = $("input.search-input");

$(function () {
    //* check for stored items in database
    database.getAll("notes", (succ, data) => {
        if (succ) {
            if (data.length !== 0) {
                $(data).each((index, item) => {
                    let itemTitle = item.title,
                        itemText = item.text,
                        itemId = item.id;
                    createNote(itemTitle, itemText, itemId);
                });
            } else {
                $(".todo-container .no-item").addClass("active");
            }
        } else {
            $(".todo-container .no-item").addClass("active");
        }
    });
    //* get the color mode from the local storage and update the body class
    let colorMode = localStorage.getItem("color-mode");
    //* if there's no data in localstorage
    if (colorMode === null) {
        //* set it to lightmode
        localStorage.setItem("color-mode", "light-mode");
    }
    //* update the body class
    $("body").removeClass().addClass(localStorage.getItem("color-mode"));
    //* if the color mode is dark
    if (colorMode === "dark-mode") {
        //* check the input checkbox
        $("input.mode-switch-input").prop("checked", true);
        //* update the toggle switch
        $("nav  .toggle-mode-switch .mode-overlay")
            .css("left", "initial")
            .animate(
                {
                    right: "0",
                },
                50,
                () => {
                    $("nav  .toggle-mode-switch .mode-overlay i").removeClass().addClass("fas fa-moon darkmode");
                    //* cancel the restrict of the click event and return it to default
                    $(".toggle-mode-switch").children().off("click");
                }
            );
        //* if the mode is light
    } else {
        //* update the toggle switch
        $("nav .toggle-mode-switch .mode-overlay")
            .animate(
                {
                    left: "0",
                },
                50,
                () => {
                    $("nav .toggle-mode-switch .mode-overlay i").removeClass().addClass("fas fa-sun lightmode");
                    //* cancel the restrict of the click event and return it to default

                    $(".toggle-mode-switch").children().off("click");
                }
            )
            .css("right", "initial");
    }
    //* Initialize niceScroll Plugin For Body
    myScroll = $("div.todo-container").niceScroll({
        cursorcolor: "#222831",
        cursorwidth: "5px",
    });
    //* Initialize The Mode Selector Bootstrap Toggle
    //* Initialize NiceScroll Plugin For Add Note Textarea
    $("nav .add-note-window .add-note-content textarea").niceScroll({
        cursorcolor: "#222831",
        cursorwidth: "5px",
        cursorborder: "1px solid #fff",
    });
});
//* When Close Button Clicked On Add Note Window Or Overlay Clicked
$("nav .add-note-window .add-note-content .close-note , .add-note-window .add-note-overlay").on("click", function () {
    //* Remove The Active Class And Hide The Window
    $("nav .add-note-window").fadeOut(500).removeClass("active");
    //* Remove The Edit Class Of The Card Item And The Confirm Add Button If Exist
    $(".add-note-confirm , .card-item").removeClass("edit");
});
//* When Home Add Note Button Clicked
$("nav .add-button").on("click", function () {
    //* Change The Confirm Add Note Button Text To Add Note
    $(".add-note-confirm").text("Add Note");
    //* Add Active Class To The Add Note Window And Show It
    $("nav .add-note-window").fadeIn(500).addClass("active");
    //* Reset The Value Of The Input And Textarea
    $("input.add-note-title , nav .add-note-window .add-note-content textarea.add-note-text").val("");
});

//* When Add Note Window's Confirm Add Note Button Clicked
$("nav .add-note-window .add-note-content .add-note-confirm").on("click", function () {
    //* Get The Input Title Content And Set It To The Note Title
    let noteTitle = $("input.add-note-title").val(),
        //* Get The Textarea Content And Set It To The Note Text
        noteText = $("nav .add-note-window .add-note-content textarea.add-note-text").val();
    //* Check If The Content Of The Input And The Text Area Is Empty
    if (noteTitle === "" && noteText === "") {
        Swal.fire("Note title and content can't be empty", "", "error");
        //* If Not Empty
    } else {
        //*Reset input and textarea Text
        $("input.add-note-title , nav .add-note-window .add-note-content textarea.add-note-text").val("");
        //* Hide The Window And Remove The Active Class
        $("nav .add-note-window").fadeOut(500).removeClass("active");
        //* If Input Title Is Empty, Set The Card Title To No Title
        if (noteTitle === "") {
            noteTitle = "No Title";
            //* If The TextArea is empty, set the card content to no content
        } else if (noteText === "") {
            noteText = "No Content";
        }
        //* If The Add Note Confirm Button Has Edit Class
        if ($("nav .add-note-window .add-note-content .add-note-confirm").hasClass("edit")) {
            cardId = $(".card-item.edit").data("id");
            //* Get The Edit Card Text Paragraph And Edit Card Title h5
            let editCardItemTitleH5 = $(".card-item.edit h5.card-header"),
                editCardItemTextP = $(".card-item.edit p.card-text");
            updateItems(cardId, noteTitle, noteText)
                .then((result) => {
                    status = result[0];
                    message = result[1];
                    if (status) {
                        //* Set The TextArea And Input Values To Them
                        $(editCardItemTextP).text(noteText);
                        $(editCardItemTitleH5).text(noteTitle);
                        //* Remove Edit Class From Both The Button And The Card Item
                        $("nav .add-note-window .add-note-content .add-note-confirm").removeClass("edit");
                        $(".card-item").removeClass("edit");
                    } else {
                        Swal.fire({
                            position: "center",
                            icon: "error",
                            title: message,
                            showConfirmButton: false,
                            timer: 1500,
                        });
                    }
                })
                .catch((result) => {
                    status = result[0];
                    error = result[1];
                    Swal.fire({
                        position: "center",
                        icon: "error",
                        title: error,
                        showConfirmButton: false,
                        timer: 1500,
                    });
                });
            //* If The Add Note Confirm Button Hasn't Edit Class
        } else {
            //* add the note to the database
            insertNotes(noteTitle, noteText).then((id) => {
                createNote(noteTitle, noteText, id);
            });
            $("body").getNiceScroll().resize();
        }
    }
    myScroll.resize();
});

//* When Delete Button Clicked, Delete The Note
$(".todo-container .row").on("click", "div.card-item div.card a.delete-note", function () {
    let parentsList = $(this).parentsUntil(".row"),
        parentCardItem = parentsList[parentsList.length - 1];
    cardId = $(parentCardItem).data("id");

    Swal.fire({
        title: "Do you want to delete this note?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
    }).then((result) => {
        if (result.isConfirmed) {
            deleteItems(cardId)
                .then((result) => {
                    status = result[0];
                    msg = result[1];
                    if (status) {
                        Swal.fire({
                            position: "center",
                            icon: "success",
                            title: "Your Note Has Been Deleted Successfully.",
                            showConfirmButton: false,
                            timer: 1500,
                        });
                        $(parentCardItem).fadeOut(500, function () {
                            $(parentCardItem).remove();
                            if ($(".todo-container .card-item").length === 0) {
                                $(".todo-container .no-item").addClass("active");
                            }
                        });
                    } else {
                        Swal.fire({
                            position: "center",
                            icon: "error",
                            title: "There Is An Error Deleting Your Item.",
                            showConfirmButton: false,
                            timer: 1500,
                        });
                    }
                })
                .catch((result) => {
                    status = result[0];
                    msg = result[1];
                    Swal.fire({
                        position: "center",
                        icon: "error",
                        title: msg,
                        showConfirmButton: false,
                        timer: 1500,
                    });
                });
        }
    });
});
//* When Edit Button Clicked, Open The Edit Window
$(".row").on("click", ".edit-note", function () {
    $("nav .add-note-window").fadeIn(500).addClass("active");
    //* Get The Parents List Of The Edit Button
    let parentsList = $(this).parentsUntil(".row"),
        //* Get The Parent Card Item
        parentCardItem = parentsList[[parentsList.length - 1]],
        //* Get The Textarea
        noteTextArea = $("nav .add-note-window .add-note-content textarea.add-note-text"),
        //* Get The title input
        titleInput = $("nav .add-note-window .add-note-content .add-note-title"),
        //* get the note text paragraph
        noteTextP = $(this).siblings("p")[0],
        //* get the note title h5
        noteTitleH5 = $(this).parent().siblings("h5")[0];
    //* set the value of the textarea to the note text paragraph content
    $(noteTextArea).val($(noteTextP).text().trim());
    //* Set the value of the title input to the note header text
    $(titleInput).val($(noteTitleH5).text().trim());
    //* add class edit to the confirm add button and change it's text to confirm edit
    $(".add-note-confirm").text("Confirm Edit").addClass("edit");
    //* add edit class to the parent card item
    $(parentCardItem).addClass("edit");
});

/*
 * Toggle The Mode Selector Button Class
 * Between Dark and light mode according to the body class
 */
$("body").on("classChange", (e, mode) => {
    localStorage.setItem("color-mode", mode);
});
//* Toggle Theme By Checkbox
$("input.mode-switch-input").on("change", function (e) {
    //* disable clicking on the input
    $(".toggle-mode-switch")
        .children()
        .on("click", function () {
            return false;
        });
    //* if the input is checked
    if (this.checked) {
        //* change body class to dark mode
        $("body").removeClass("light-mode").addClass("dark-mode");
        //* trigget the class change event and pass dark mode as argument
        $("body").trigger("classChange", ["dark-mode"]);
        $("nav  .toggle-mode-switch .mode-overlay")
            .css("left", "initial")
            .animate(
                {
                    right: "0",
                },
                300,
                () => {
                    $("nav  .toggle-mode-switch .mode-overlay i").removeClass().addClass("fas fa-moon darkmode");
                    //* cancel the restrict of the click event and return it to default
                    $(".toggle-mode-switch").children().off("click");
                }
            );
    } else {
        //*change body class to light mode
        $("body").removeClass("dark-mode").addClass("light-mode");
        //* trigget the class change event and pass light mode as argument
        $("body").trigger("classChange", ["light-mode"]);
        $("nav .toggle-mode-switch .mode-overlay")
            .animate(
                {
                    left: "0",
                },
                300,
                () => {
                    $("nav .toggle-mode-switch .mode-overlay i").removeClass().addClass("fas fa-sun lightmode");
                    //* cancel the restrict of the click event and return it to default

                    $(".toggle-mode-switch").children().off("click");
                }
            )
            .css("right", "initial");
    }
});

//*when key is pressed down in search input
searchInput.on("keyup", (e) => {
    //* get the input value
    let inputText = $(searchInput).val();
    //* loop for each note card
    $(".todo-container .card-item").each((index, card) => {
        //* get the text of the note card and convert it to lowercase
        let eachText = $(card).find(".card-text").text().toLowerCase();
        //* if the text of the input is in the text of the card
        if (eachText.includes(inputText.toLowerCase())) {
            //* show this card
            $(card).fadeIn(150);
            //* if not
        } else {
            //* hide the card
            $(card).fadeOut(150);
        }
    });
});

//* when user right click on card text

let insertNotes = function insertNote(noteTitle, noteText) {
    return new Promise((resolve, reject) => {
        //* check if the database exist
        if (database.tableExists("notes")) {
            //* if not exist , create one
        } else {
            database.createTable("notes", (succ, msg) => {});
        }
        //* initialize the note object
        let noteObject = new Object();
        noteObject.title = noteTitle;
        noteObject.text = noteText;
        database.insertTableContent("notes", noteObject, (success, info) => {
            if (!success) {
                Swal.fire(info, "", "error").then(reject("error"));
            } else {
                resolve(info);
            }
        });
    });
};

//* when context menu add note clicked and ipc main send a signal to the renderer toggle click
ipcRenderer.on("add-note", () => {
    "nav .add-button".click();
});

function createNote(noteTitle, noteText, id) {
    //* Create Card Elements
    let cardItemDiv = document.createElement("div"),
        cardDiv = document.createElement("div"),
        cardHeaderH5 = document.createElement("h5"),
        cardBodyDiv = document.createElement("div"),
        cardTextP = document.createElement("p"),
        cardDeleteNoteA = document.createElement("a"),
        cardEditNoteA = document.createElement("a");
    //* Add Classes To Elements
    $(cardItemDiv).addClass("col card-item wow bounceInLeft");
    $(cardItemDiv).attr("data-id", id);
    $(cardItemDiv).attr("data-wow-offset", "100");
    $(cardDiv).addClass("card");
    $(cardHeaderH5).addClass("card-header");
    $(cardBodyDiv).addClass("card-body");
    $(cardTextP).addClass("card-text");
    $(cardDeleteNoteA).addClass("btn delete-note");
    $(cardEditNoteA).addClass("btn edit-note");
    //* Add Text To Elements
    $(cardHeaderH5).text(noteTitle);
    $(cardTextP).text(noteText);
    $(cardDeleteNoteA).text("Delete Note");
    $(cardEditNoteA).text("Edit Note");
    //* Add Children To Parents
    $(cardBodyDiv).append(cardTextP, cardDeleteNoteA, cardEditNoteA);
    $(cardDiv).append(cardHeaderH5, cardBodyDiv);
    $(cardItemDiv).append(cardDiv);
    $("div.todo-container .contain .row").append(cardItemDiv);
    $(".no-item").removeClass("active");
}

let deleteItems = function deleteItem(cardId) {
    return new Promise((resolve, reject) => {
        database.deleteRow("notes", { id: cardId }, (status, msg) => {
            if (status) {
                resolve([status, msg]);
            } else {
                reject([status, msg]);
            }
        });
    });
};

let updateItems = function updateItem(cardId, cardTitle, cardText) {
    return new Promise((resolve, reject) => {
        where = {
            id: cardId,
        };
        set = {
            id: cardId,
            text: cardText,
            title: cardTitle,
        };
        database.updateRow("notes", where, set, (status, msg) => {
            if (status) {
                resolve([status, msg]);
            } else {
                reject([status, msg]);
            }
        });
    });
};
