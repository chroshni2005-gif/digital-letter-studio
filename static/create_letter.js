document.addEventListener("DOMContentLoaded", function () {

    // =====================================================
    // MAIN ELEMENTS
    // =====================================================

    const letter = document.querySelector(".letter");
    const decorationArea = document.querySelector(".placed-decorations");

    if (!letter || !decorationArea) {
        console.error("Letter or decoration area not found.");
        return;
    }


    // =====================================================
    // DECORATION DATA
    // =====================================================

    const decorationData = {
        babybreath: "/static/decorations/babybreath.png",
        fern: "/static/decorations/fern.png",
        heartpin: "/static/decorations/heartpin.png",
        lavender: "/static/decorations/lavender.png",
        redribbon: "/static/decorations/redribbon.png",
        rose: "/static/decorations/rose.png",
        sparkle: "/static/decorations/sparkle.png",
        standalone: "/static/decorations/standalone.png",
        whiteribbon: "/static/decorations/whiteribbon.png"
    };


    // =====================================================
    // VARIABLES
    // =====================================================

    let draggedDecoration = null;

    let isMoving = false;
    let isResizing = false;
    let isRotating = false;

    let offsetX = 0;
    let offsetY = 0;

    let resizeStartSize = 120;
    let resizeStartX = 0;

    let rotateCenterX = 0;
    let rotateCenterY = 0;

    let rotateStartAngle = 0;

    let moveStartLeft = "";
    let moveStartTop = "";

    let undoStack = [];


    // =====================================================
    // UNDO BUTTON
    // =====================================================

    const undoButton = document.createElement("button");

    undoButton.id = "undoButton";
    undoButton.className = "undo-button";
    undoButton.innerHTML = "↩️ Undo";
    undoButton.disabled = true;

    document.body.appendChild(undoButton);


    function updateUndoButton() {
        undoButton.disabled = undoStack.length === 0;
    }


    function saveAction(action) {
        undoStack.push(action);
        updateUndoButton();
    }


    undoButton.addEventListener("click", function () {

        if (undoStack.length === 0) {
            return;
        }

        const action = undoStack.pop();

        if (action.type === "add") {

            if (action.element && action.element.parentNode) {
                action.element.remove();
            }

        }

        else if (action.type === "delete") {

            if (action.element && !action.element.parentNode) {
                decorationArea.appendChild(action.element);
            }

        }

        else if (action.type === "move") {

            action.element.style.left = action.oldLeft;
            action.element.style.top = action.oldTop;

        }

        else if (action.type === "resize") {

            setDecorationSize(
                action.element,
                action.oldSize
            );

        }

        else if (action.type === "rotate") {

            action.element.style.transform =
                `rotate(${action.oldAngle}deg)`;

            action.element.dataset.angle =
                action.oldAngle;

        }

        updateUndoButton();
    });


    // =====================================================
    // SIDEBAR DRAG
    // =====================================================

    const decorations =
        document.querySelectorAll(".decoration");


    decorations.forEach(function (decoration) {

        decoration.addEventListener("dragstart", function (event) {

            const type =
                decoration.dataset.decoration;

            console.log("Dragging:", type);

            event.dataTransfer.clearData();

            event.dataTransfer.setData(
                "text/plain",
                type
            );

            event.dataTransfer.effectAllowed = "copy";

            decoration.classList.add("dragging");

        });


        decoration.addEventListener("dragend", function () {

            decoration.classList.remove("dragging");

        });

    });


    // =====================================================
    // ALLOW DROP ON LETTER
    // =====================================================

    letter.addEventListener("dragenter", function (event) {

        event.preventDefault();

        event.dataTransfer.dropEffect = "copy";

    });


    letter.addEventListener("dragover", function (event) {

        event.preventDefault();

        event.dataTransfer.dropEffect = "copy";

    });


    // =====================================================
    // DROP DECORATION
    // =====================================================

    letter.addEventListener("drop", function (event) {

        event.preventDefault();
        event.stopPropagation();

        const type =
            event.dataTransfer.getData("text/plain");

        console.log("Dropped:", type);

        if (!decorationData[type]) {
            console.error("Unknown decoration:", type);
            return;
        }


        const letterBox =
            letter.getBoundingClientRect();


        // Position inside letter

        let x =
            event.clientX -
            letterBox.left;


        let y =
            event.clientY -
            letterBox.top;


        // Keep decoration inside letter

        x = Math.max(0, x);
        y = Math.max(0, y);


        // =================================================
        // CREATE WRAPPER
        // =================================================

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "decoration-wrapper";

        wrapper.dataset.type =
            type;

        wrapper.dataset.angle =
            "0";


        wrapper.style.left =
            (x - 60) + "px";

        wrapper.style.top =
            (y - 60) + "px";


        // =================================================
        // CREATE IMAGE
        // =================================================

        const image =
            document.createElement("img");

        image.className =
            "placed-decoration";

        image.src =
            decorationData[type];

        image.draggable =
            false;


        // Prevent image dragging interfering

        image.addEventListener("dragstart", function (e) {
            e.preventDefault();
        });


        wrapper.appendChild(image);


        // =================================================
        // ADD TO LETTER
        // =================================================

        decorationArea.appendChild(wrapper);


        // =================================================
        // ENABLE MOVING
        // =================================================

        makeMovable(wrapper);


        // =================================================
        // ADD CONTROLS
        // =================================================

        addControls(wrapper);


        // =================================================
        // SELECT
        // =================================================

        selectDecoration(wrapper);


        // =================================================
        // SAVE UNDO
        // =================================================

        saveAction({
            type: "add",
            element: wrapper
        });

    });


    // =====================================================
    // SELECT DECORATION
    // =====================================================

    function selectDecoration(element) {

        document
            .querySelectorAll(".decoration-wrapper")
            .forEach(function (item) {

                item.classList.remove("selected");

            });


        element.classList.add("selected");
    }


    // =====================================================
    // MOVE DECORATION
    // =====================================================

    function makeMovable(element) {

        element.addEventListener("mousedown", function (event) {

            if (event.button !== 0) {
                return;
            }


            // Don't move when clicking controls

            if (
                event.target.classList.contains("delete-decoration") ||
                event.target.classList.contains("resize-handle") ||
                event.target.classList.contains("rotate-handle")
            ) {
                return;
            }


            event.preventDefault();
            event.stopPropagation();


            selectDecoration(element);


            isMoving = true;

            draggedDecoration = element;


            const box =
                element.getBoundingClientRect();


            offsetX =
                event.clientX - box.left;

            offsetY =
                event.clientY - box.top;


            moveStartLeft =
                element.style.left;

            moveStartTop =
                element.style.top;

        });

    }


    // =====================================================
    // MOVE
    // =====================================================

    document.addEventListener("mousemove", function (event) {

        if (!isMoving || !draggedDecoration) {
            return;
        }


        const letterBox =
            letter.getBoundingClientRect();


        draggedDecoration.style.left =
            (
                event.clientX -
                letterBox.left -
                offsetX
            ) + "px";


        draggedDecoration.style.top =
            (
                event.clientY -
                letterBox.top -
                offsetY
            ) + "px";

    });


    // =====================================================
    // ADD CONTROLS
    // =====================================================

    function addControls(element) {

        // -------------------------------------------------
        // DELETE
        // -------------------------------------------------

        const deleteButton =
            document.createElement("button");

        deleteButton.className =
            "delete-decoration";

        deleteButton.innerHTML =
            "×";

        deleteButton.title =
            "Delete decoration";


        element.appendChild(deleteButton);


        deleteButton.addEventListener(
            "mousedown",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

            }
        );


        deleteButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();


                saveAction({
                    type: "delete",
                    element: element
                });


                element.remove();

            }
        );


        // -------------------------------------------------
        // RESIZE
        // -------------------------------------------------

        const resizeHandle =
            document.createElement("div");

        resizeHandle.className =
            "resize-handle";

        resizeHandle.title =
            "Resize";


        element.appendChild(resizeHandle);


        resizeHandle.addEventListener(
            "mousedown",
            function (event) {

                event.preventDefault();
                event.stopPropagation();


                selectDecoration(element);


                isResizing = true;

                draggedDecoration = element;


                resizeStartSize =
                    getDecorationSize(element);


                resizeStartX =
                    event.clientX;

            }
        );


        // -------------------------------------------------
        // ROTATE
        // -------------------------------------------------

        const rotateHandle =
            document.createElement("div");

        rotateHandle.className =
            "rotate-handle";

        rotateHandle.innerHTML =
            "↻";

        rotateHandle.title =
            "Rotate";


        element.appendChild(rotateHandle);


        rotateHandle.addEventListener(
            "mousedown",
            function (event) {

                event.preventDefault();
                event.stopPropagation();


                selectDecoration(element);


                isRotating = true;

                draggedDecoration = element;


                const box =
                    element.getBoundingClientRect();


                rotateCenterX =
                    box.left +
                    box.width / 2;


                rotateCenterY =
                    box.top +
                    box.height / 2;


                rotateStartAngle =
                    parseFloat(
                        element.dataset.angle || "0"
                    );

            }
        );

    }


    // =====================================================
    // GET SIZE
    // =====================================================

    function getDecorationSize(element) {

        const image =
            element.querySelector(".placed-decoration");


        if (!image) {
            return 120;
        }


        return parseFloat(
            image.style.width || "120"
        );

    }


    // =====================================================
    // SET SIZE
    // =====================================================

    function setDecorationSize(element, size) {

        const image =
            element.querySelector(".placed-decoration");


        if (image) {

            image.style.width =
                size + "px";

        }

    }


    // =====================================================
    // RESIZE
    // =====================================================

    document.addEventListener("mousemove", function (event) {

        if (!isResizing || !draggedDecoration) {
            return;
        }


        const difference =
            event.clientX -
            resizeStartX;


        let newSize =
            resizeStartSize +
            difference;


        newSize =
            Math.max(
                30,
                Math.min(400, newSize)
            );


        setDecorationSize(
            draggedDecoration,
            newSize
        );

    });


    // =====================================================
    // ROTATE
    // =====================================================

    document.addEventListener("mousemove", function (event) {

        if (!isRotating || !draggedDecoration) {
            return;
        }


        const angle =
            Math.atan2(
                event.clientY - rotateCenterY,
                event.clientX - rotateCenterX
            ) *
            (180 / Math.PI);


        draggedDecoration.style.transform =
            `rotate(${angle}deg)`;


        draggedDecoration.dataset.angle =
            angle;

    });


    // =====================================================
    // STOP MOVEMENT / RESIZE / ROTATE
    // =====================================================

    document.addEventListener("mouseup", function () {

        // -------------------------------------------------
        // MOVE
        // -------------------------------------------------

        if (isMoving && draggedDecoration) {

            const newLeft =
                draggedDecoration.style.left;

            const newTop =
                draggedDecoration.style.top;


            if (
                moveStartLeft !== newLeft ||
                moveStartTop !== newTop
            ) {

                saveAction({
                    type: "move",

                    element:
                        draggedDecoration,

                    oldLeft:
                        moveStartLeft,

                    oldTop:
                        moveStartTop
                });

            }

        }


        // -------------------------------------------------
        // RESIZE
        // -------------------------------------------------

        if (isResizing && draggedDecoration) {

            const newSize =
                getDecorationSize(
                    draggedDecoration
                );


            if (
                resizeStartSize !== newSize
            ) {

                saveAction({
                    type: "resize",

                    element:
                        draggedDecoration,

                    oldSize:
                        resizeStartSize
                });

            }

        }


        // -------------------------------------------------
        // ROTATE
        // -------------------------------------------------

        if (isRotating && draggedDecoration) {

            const newAngle =
                parseFloat(
                    draggedDecoration.dataset.angle || "0"
                );


            if (
                rotateStartAngle !== newAngle
            ) {

                saveAction({
                    type: "rotate",

                    element:
                        draggedDecoration,

                    oldAngle:
                        rotateStartAngle
                });

            }

        }


        isMoving = false;
        isResizing = false;
        isRotating = false;

        draggedDecoration = null;

    });


    // =====================================================
    // DESELECT
    // =====================================================

    letter.addEventListener("mousedown", function (event) {

        if (
            event.target === letter ||
            event.target === decorationArea
        ) {

            document
                .querySelectorAll(".decoration-wrapper")
                .forEach(function (item) {

                    item.classList.remove("selected");

                });

        }

    });


    // =====================================================
    // FONT
    // =====================================================

    const fontStyle =
        document.getElementById("fontStyle");


    const letterContent =
        document.querySelector(".letter-content");


    if (fontStyle && letterContent) {

        fontStyle.addEventListener(
            "change",
            function () {

                letterContent.style.fontFamily =
                    this.value;

            }
        );

    }


    // =====================================================
    // ENVELOPE
    // =====================================================
    // KEEPING YOUR EXISTING ENVELOPE SYSTEM
    // =====================================================

    const createLetterButton =
        document.getElementById("createLetterButton");

    const envelopeScreen =
        document.getElementById("envelopeScreen");

    const envelopeImage =
        document.getElementById("envelopeImage");

    const openLetterButton =
        document.getElementById("openLetterButton");

    const envelopeRecipient =
        document.getElementById("envelopeRecipient");

    const previewFrom =
        document.getElementById("previewFrom");

    const previewTo =
        document.getElementById("previewTo");

    const previewMessage =
        document.getElementById("previewMessage");

    const previewSignature =
        document.getElementById("previewSignature");

    const previewDecorations =
        document.getElementById("previewDecorations");


    // =====================================================
    // CREATE LETTER
    // =====================================================

    if (
        createLetterButton &&
        envelopeScreen
    ) {

        createLetterButton.addEventListener(
            "click",
            function () {

                const inputs =
                    document.querySelectorAll(
                        ".letter-content input"
                    );


                const sender =
                    inputs[0]?.value.trim() || "";


                const recipient =
                    inputs[1]?.value.trim() || "You";


                const signature =
                    inputs[2]?.value.trim() || "";


                const textarea =
                    document.querySelector(
                        ".letter-content textarea"
                    );


                const message =
                    textarea?.value.trim() || "";


                if (envelopeRecipient) {

                    envelopeRecipient.textContent =
                        "For " +
                        recipient +
                        " 💌";

                }


                if (previewFrom) {

                    previewFrom.textContent =
                        sender
                            ? "From " + sender
                            : "";

                }


                if (previewTo) {

                    previewTo.textContent =
                        recipient
                            ? "Dear " + recipient
                            : "";

                }


                if (previewMessage) {

                    previewMessage.textContent =
                        message;

                }


                if (previewSignature) {

                    previewSignature.textContent =
                        signature
                            ? "With love, " + signature
                            : "";

                }
                // =====================================================
// COPY THE COMPLETE CREATED LETTER
// =====================================================

const actualLetter =
    document.querySelector(".letter");

const openingLetter =
    document.getElementById("openingLetter");

if (actualLetter && openingLetter) {

    // Remove the old preview
    openingLetter.innerHTML = "";

    // Clone the complete designed letter
    const letterClone =
        actualLetter.cloneNode(true);

    // Remove editor-only controls from the clone
    letterClone
        .querySelectorAll(
            ".delete-decoration, .resize-handle, .rotate-handle"
        )
        .forEach(function (element) {
            element.remove();
        });

    // Put the actual created letter inside the envelope
    openingLetter.appendChild(letterClone);

}


                // -----------------------------------------
                // COPY DECORATIONS
                // -----------------------------------------

                if (previewDecorations) {

                    previewDecorations.innerHTML = "";


                    document
                        .querySelectorAll(
                            ".decoration-wrapper"
                        )
                        .forEach(function (decoration) {


                            const image =
                                decoration.querySelector(
                                    ".placed-decoration"
                                );


                            if (!image) {
                                return;
                            }


                            const previewImage =
                                document.createElement("img");


                            previewImage.className =
                                "preview-decoration";


                            previewImage.src =
                                image.src;


                            previewImage.style.left =
                                decoration.style.left;


                            previewImage.style.top =
                                decoration.style.top;


                            previewImage.style.width =
                                (
                                    getDecorationSize(
                                        decoration
                                    ) * 0.72
                                ) + "px";


                            previewImage.style.transform =
                                `rotate(${
                                    decoration.dataset.angle || 0
                                }deg)`;


                            previewDecorations.appendChild(
                                previewImage
                            );

                        });

                }


                // -----------------------------------------
                // SHOW ENVELOPE
                // -----------------------------------------

                if (envelopeScreen) {

                    envelopeScreen.classList.remove(
                        "opening"
                    );

                    envelopeScreen.classList.remove(
                        "opened"
                    );

                    envelopeScreen.style.display
                     =
                        "flex";

                }


                if (openLetterButton) {

                    openLetterButton.style.display =
                        "block";

                    openLetterButton.style.opacity =
                        "1";

                    openLetterButton.disabled =
                        false;

                }

            }
        );

    }


    // =====================================================
    // OPEN ENVELOPE
    // =====================================================

    function openEnvelope() {

        if (!envelopeScreen) {
            return;
        }


        if (
            envelopeScreen.classList.contains("opening") ||
            envelopeScreen.classList.contains("opened")
        ) {

            return;

        }


        envelopeScreen.classList.add("opening");


        if (openLetterButton) {

            openLetterButton.style.opacity =
                "0";

        }


        setTimeout(function () {

            envelopeScreen.classList.add("opened");


            if (openLetterButton) {

                openLetterButton.style.display =
                    "none";

            }

        }, 1200);

    }


    if (openLetterButton) {

        openLetterButton.addEventListener(
            "click",
            openEnvelope
        );

    }


    if (envelopeImage) {

        envelopeImage.addEventListener(
            "click",
            openEnvelope
        );

    }


    // =====================================================
    // READY
    // =====================================================

    console.log(
        "Digital Letter Studio loaded successfully."
    );

});