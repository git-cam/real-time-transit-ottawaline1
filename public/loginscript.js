

let socket; //by default connects to same server that served the page

function handleKeyDown(event) {
    const ENTER_KEY = 13 //keycode for enter key
    if (event.keyCode === ENTER_KEY) {
      submit()
      return false //don't propogate event
    }
  }

function submit(){
    username = document.getElementById('username').value.trim();
    password = document.getElementById('password').value.trim();
}
document.addEventListener('DOMContentLoaded', function() {
    //This function is called after the browser has loaded the web page
  
    //add listener to buttons
    document.getElementById('send_button').addEventListener('click', submit)
  
    //add keyboard handler for the document as a whole, not separate elements.
    document.addEventListener('keydown', handleKeyDown)
    //document.addEventListener('keyup', handleKeyUp)
  })