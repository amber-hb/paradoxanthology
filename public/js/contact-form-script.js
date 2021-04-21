const contactForm = document.querySelector('.contact-form');

let fname = document.getElementById('firstNameValidation');
let lname = document.getElementById('lastNameValidation');
let email = document.getElementById('emailValidation');
let subject = document.getElementById('subjectValidation');
let message = document.getElementById('messageValidation');

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    let formData = {
        name: fname.value +" "+ lname.value,
        email: email.value,
        subject: subject.value,
        message: message.value
    }

    let xhr = new XMLHttpRequest();

    xhr.open('POST', '/index');
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.onload = function(){
        console.log(xhr.responseText);
        if(xhr.responseText == 'success'){
            alert('Email Sent');
            fname.value = '';
            lname.value = '';
            email.value = '';
            subject.value = '';
            message.value = '';
        } else {
            alert('An Error Has Occured: Email has not been sent.');
        }
    }

    xhr.send(JSON.stringify(formData));
})