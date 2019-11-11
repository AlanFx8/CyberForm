(function(){
    //DECLARATIONS//
    const theForm = document.getElementById("mainForm");
    theForm.noValidate = true;
    var validatedElements = {};
    var errorMessageObjects = {};

    const _errorObTag = "errorMSG";
    const _invalidInputTag = "invalid";
    
    const _birthDay = document.getElementById("birthDay");
    const _birthMonth = document.getElementById("birthMonth");
    const _birthYear = document.getElementById("birthYear");
    
    const _password = document.getElementById("password");
    const _passwordConfirm = document.getElementById("passwordConfirm");
    var passwordInitialIsValid;
    var passwordsHidden = true;
    
    const _bio = document.getElementById("bio");
    const _bioInfo = document.getElementById("bioInfo");
    const _bioLimit = 250;
    
    const _keySpace = "32";
    const _keyBackspace = "8";
    const _keyLeft = "37";
    const _keyRight = "39";

    //START//
    for (let x = 0; x < theForm.elements.length; x++){
        if (theForm.elements[x].nodeName.toLocaleLowerCase() === 'input' ||
        theForm.elements[x].nodeName.toLocaleLowerCase() === 'textarea'){
            let el = theForm.elements[x];

            if (!_isEmpty(el)){ //For firefox, which saves form inputs on reload
                el.classList.add("inUse");
            }

            el.addEventListener("focus", (e)=>{
                e.target.classList.add("inUse");
            }, false);
            
            el.addEventListener("blur", (e)=>{
                if (_isEmpty(e.target)){
                    e.target.classList.remove("inUse");
                }
            }, false);
        }
    }
    ValidateBio();

    ///EVENTS///
    //Keydown Event
    theForm.addEventListener("keydown", (e)=>{
        let el = e.target.id;
        
        //Names
        if (el.endsWith("Name")){            
            if (_isNumberKey(e.keyCode)){
                e.preventDefault();
            }
            else if (e.keyCode == _keySpace && !el.startsWith("middle")){
                e.preventDefault();
            }
        }
        
        //Date of Birth
        if (el.startsWith("birth")){
            if (!_isNumberKey(e.keyCode) && e.keyCode != _keyBackspace
                && e.keyCode != _keyLeft && e.keyCode != _keyRight){
                e.preventDefault();
            }
        }

        //Password
        if (el.startsWith("password")){
            if (e.keyCode == _keySpace){
                e.preventDefault();
            }
        }

        //Bio
        if (el == "bio"){
            ValidateBio();
        }
    }, false);

    //KeyUp
    theForm.addEventListener("keyup", (e)=>{
        if (e.target == _birthDay && e.target.value.length == 2){
            _birthMonth.focus();
        }
        else if (e.target == _birthMonth && e.target.value.length == 2){
            _birthYear.focus();
        }

        if (e.target == _bio){ //For deleting entire selection
            ValidateBio();
        }
    }, false);

    //Change Event
    theForm.addEventListener("change", (e)=>{
        if (e.target.id.startsWith("birth")){
            //It better to only validate the DOB on submission
            //Unless it is already invalid, at which case we need to validate it on change
            if (validatedElements["birthDay"] == false){
                ValidateDOB();
                return;
            }
            else {
                return;
            }
        }
        _findValidationMethod(e.target);
    }, false);

    //Submit Event
    theForm.addEventListener("submit", (e)=>{
        e.preventDefault();
        let formElements = theForm.elements;
        for (let x = 0; x < formElements.length; x++){
            let el = formElements[x];
            if (!_isSkipableFormElement(el))
                _findValidationMethod(el);
        }
        if (_formIsValidated()){
            alert("Form is validated!");
        }
    }, false);
    
    ///PASSWORD TOGGLE///
    document.getElementById("passwordToggle").addEventListener("click", (e)=>{
        if (passwordsHidden){
            _password.setAttribute("type", "text");
            _passwordConfirm.setAttribute("type", "text");
            e.target.classList.replace("fa-eye-slash", "fa-eye");
            passwordsHidden = false;
        }
        else {
            _password.setAttribute("type", "password");
            _passwordConfirm.setAttribute("type", "password");
            e.target.classList.replace("fa-eye", "fa-eye-slash");
            passwordsHidden = true;
        }
    }, false);

    ///VALIDATION FUNCTIONS///
    function ValidateElement(el){
        //First - check if a required element is empty
        if (_isRequired(el) && _isEmpty(el)){
            AddErrorMessage(el, `This is a required element.`);
            return;
        }
        else {
            if (_isRequired(el)){ //Avoid trying to remove errors from optional elements
                RemoveErrorMessage(el);
            }
        }

        //First and Last Name
        if (el.id.endsWith("Name") && !el.id.startsWith("middle")){
            if (el.value.length < 2 || el.value.length > 20){
                AddErrorMessage(el, 'Please ensure name is between 2 and 20 characters');
            }
            else if (!/^[A-Za-z/]+[\-\']?[A-Za-z]+[\-\']?[A-Za-z]*$/i.test(el.value)){
                AddErrorMessage(el, 'No spaces or digits or non-letter characters please');
            }
        }

        //Email
        if (el.id == "email"){
            if (!/\S+@\S+\.\S+/.test(el.value)){
                AddErrorMessage(el, "Invalid Email");
            }
        }
    }

    function ValidateDOB(){
        //Ensure all fields are filled
        if (_isEmpty(_birthDay) || _isEmpty(_birthMonth) || _isEmpty(_birthYear)){
            _setDOBError('Please ensure DOB is complete.');
            return;
        }

        //Correct DD - MM - YYYYY Format
        if (_birthDay.value.length < 2 || _birthMonth.value.length < 2 || _birthYear.value.length < 4){
            _setDOBError('Please follow the DD-MM-YYYY format.');
            return;
        }

        //Ensure actual month and day exist
        let dayVal = parseInt(_birthDay.value);
        let monthVal = parseInt(_birthMonth.value);
        if (dayVal < 1 || dayVal > 31 || monthVal < 1 || monthVal > 12){
            _setDOBError('Please ensure day and / or month exist.');
            return;
        }

        //Check if the day fits wihin the month
        if (monthVal == 2 && dayVal > 29 || monthVal == 4 && dayVal > 30 ||
            monthVal == 6 && dayVal > 30 || monthVal == 9 && dayVal > 30 || monthVal == 11 && dayVal > 30){
            _setDOBError('Please ensure day fits within the month.');
            return;
        }

        //DOB is valid
        RemoveErrorMessage(_birthDay);
        _birthMonth.classList.remove(_invalidInputTag);
        _birthYear.classList.remove(_invalidInputTag);
        _birthDay.parentNode.classList.remove(_invalidInputTag);

        //Helper function for errors
        function _setDOBError(message){
            AddErrorMessage(_birthDay, message);
            _birthMonth.classList.add(_invalidInputTag);
            _birthYear.classList.add(_invalidInputTag);
            _birthDay.parentNode.classList.add(_invalidInputTag);
        }
    }

    function ValidatePassword(el){
        //We seperate the two elements as passwordConfirm relies on passwordInitial
        if (el.id == "password"){
            ValidatePasswordInitial();
        }
        else {
            ValidatePasswordConfirm();
        }
    }

    function ValidatePasswordInitial(){
        if (_isEmpty(_password)){
            AddErrorMessage(_password, "This is a required element");
            _passwordConfirm.classList.add(_invalidInputTag);
            passwordInitialIsValid = false;
            return;
        }
        
        if (_password.value.length < 6 || !/[A-Z]/.test(_password.value) || !/[0-9]/.test(_password.value)){
            AddErrorMessage(_password, 'Password must be at least 6 chars long and have 1 digit and 1 capitial letter');
            _passwordConfirm.classList.add(_invalidInputTag);
            passwordInitialIsValid = false;
            return;
        }

        //Validated
        passwordInitialIsValid = true;
        if (_passwordConfirm.classList.contains(_invalidInputTag)){
            if (_passwordConfirm.value.length === 0){
                AddErrorMessage(_password, 'Now please confirm the password');
            }
            else {
                ValidatePasswordConfirm();
            }
        }
        else {
            RemoveErrorMessage(_password);
            if (_passwordConfirm.value.length > 0){ //Don't give the Confirm a 'is required' error as soon as the user clicks on it
                ValidatePasswordConfirm();
            }
        }
    }

    function ValidatePasswordConfirm(){
        if (!passwordInitialIsValid) return; //No point validating until the actual password is valid

        if (_isEmpty(_passwordConfirm)){
            AddErrorMessage(_password, "Password Confirm is also required");
            _passwordConfirm.classList.add(_invalidInputTag);
            return;
        }

        if (_passwordConfirm.value !== _password.value){
            AddErrorMessage(_password, "Passwords do not match");
            _passwordConfirm.classList.add(_invalidInputTag);
            return;
        }
        
        RemoveErrorMessage(_password);
        _passwordConfirm.classList.remove(_invalidInputTag);
    }

    function ValidateBio(){
        let charsLeft = _bioLimit - _bio.value.length;
        _bioInfo.textContent = `Chars available: ${charsLeft} / ${_bioLimit}`;
        if (charsLeft < 0){
            _bioInfo.classList.add(_invalidInputTag);
            validatedElements["bio"] = false;
        }
        else {
            _bioInfo.classList.remove(_invalidInputTag);
            validatedElements["bio"] = true; 
        }
    }

    //ERRORS//
    function AddErrorMessage(el, message){
        let theID = el.id;
        let errorOb = errorMessageObjects[theID] || CreateErrorObject(el);
        errorOb.classList.add("active");
        errorOb.textContent = message;
        el.classList.add(_invalidInputTag);
        validatedElements[theID] = false;
    }

    function RemoveErrorMessage(el){
        let theID = el.id;
        let errorOb = errorMessageObjects[theID] || CreateErrorObject(el);
        errorOb.textContent = "";
        errorOb.classList.remove("active");
        el.classList.remove(_invalidInputTag);
        validatedElements[theID] = true;
    }

    function CreateErrorObject(el){
        let theID = el.id;
        let parent = el.parentNode;
        let errorOb = document.createElement("div");
        errorOb.classList.add(_errorObTag);
        //HACK: For passwords, we want the message below the passwordWrapper
        //So it does not push down the passwordToggle and this is the cleanest way
        if (theID == "password"){
            parent = document.getElementById("passwordWrapper");
        }
        parent.insertAdjacentElement("afterend", errorOb);
        errorMessageObjects[theID] = errorOb;
        return errorOb;
    }

    ///HELPERS///
    function _findValidationMethod(el){
        if (el.id.startsWith("birth")){
            ValidateDOB();
        }
        else if (el.id.startsWith("password")){
            ValidatePassword(el);
        }
        else {
            ValidateElement(el);
        }
    }

    function _formIsValidated(){
        for (var el in validatedElements){
            if (validatedElements[el] === false){
                return false;
            }
        }
        return true;
    }

    function _isRequired(el){
        return (typeof el.required === 'boolean' && el.required === true) || (el.required === 'string');
    }

    function _isEmpty(el){
        return !el.value || el.value === el.placeholder;
    }

    function _isSkipableFormElement(el){
        let _name = el.nodeName.toLocaleLowerCase();
        return (_name === 'fieldset' || _name === 'button' || _name === 'select');
    }

    function _isNumberKey(key){
        return ((key >= 48 && key <= 57) //0-9 keys
                ||(key >= 96 && key <= 105)); //0-9 numpad
    }
})();