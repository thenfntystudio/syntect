const user_id = document.body.dataset.userId;
const dark_mode = document.body.dataset.darkMode;
const listContainer = document.querySelector('.list');
const dropArea = document.querySelector('.drop-section');
const fileSelector = document.querySelector('.file-selector');
const fileSelectorInput = document.querySelector('.file-selector-input');
const scanButton = document.getElementById('scanbutton');
const body = document.querySelector('body'),
    sidebar = body.querySelector('.sidebar'),
    toggle = body.querySelector('.toggle'),
    searchBtn = body.querySelector('.search-box'),
    modeSwitch = body.querySelector('.toggle-switch'),
    modeText = body.querySelector('.mode-text');

    toggle.addEventListener('click', () =>{
        sidebar.classList.toggle('close')
    });

    modeSwitch.addEventListener('click', async () => {
        body.classList.toggle('dark');

        if (body.classList.contains('dark')) {
            modeText.innerText = 'Light Mode';
            await updatePreference(true);
        } else {
            modeText.innerText = 'Dark Mode';
            await updatePreference(0);
        }
    });




// Hide Top-Bar on Scroll
var prevScrollpos = window.pageYOffset;
window.onscroll = function() {
var currentScrollPos = window.pageYOffset;
    if (prevScrollpos > currentScrollPos) {
    document.getElementById("top-bar").style.top = "0";
    } else {
    document.getElementById("top-bar").style.top = "-88px";
    }
    prevScrollpos = currentScrollPos;
}



// upload files with browser button
fileSelector.onclick =() => fileSelectorInput.click()
fileSelectorInput.onchange = () => {
    [...fileSelectorInput.files].forEach((file) => {
        if (typeValidation(file.type)) {
            uploadFile(file);
            console.log('Upload browse button executed!');
        }
    });
};

// when file is over the drag area
dropArea.ondragover = (e) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
        dropArea.classList.add('drag-over-effect');
        document.querySelector('.drop-here').innerText = 'Drop Here';
    }
};


// when file leave the drop area
dropArea.ondragleave = () => {
    dropArea.classList.remove('drag-over-effect');
};

// when file drop on the drag area
dropArea.ondrop = (e) => {
    e.preventDefault();
    dropArea.classList.remove('drag-over-effect');
    [...e.dataTransfer.files].forEach((file) => {
        if (typeValidation(file.type)) {
            uploadFile(file);
            console.log('Upload drop area executed!');

        }
    });

};

// check the file type
function typeValidation(type) {
    var splitType = type.split('/')[1]; // Get the file extension

    if (splitType === 'jpeg' || splitType === 'jpg') {
        return true;
    } else if (splitType === 'mp3') {
        return true;
    } else if (splitType === 'mp4') {
        return true;
    } else {
        return false;
    }
}

function updateButtonStatus() {
    const listItems = document.querySelectorAll('.list li');
    if (listItems.length > 0) {
        scanButton.classList.add('enabled');
    } else {
        scanButton.classList.remove('enabled');
    }
}

// Upload file function
function uploadFile(file) {
  var listSection = document.querySelector('.list-section');
  listSection.style.display = 'block';

  var li = document.createElement('li');
  li.classList.add('in-prog');
  li.innerHTML = `
        <div class="col">
            <img src="static/${iconSelector(file.type)}" alt="">
        </div>
        <div class="col">
            <div class="file-name">
                <div class="name">${file.name}</div>
                <span>0%</span>
            </div>
            <div class="file-progress">
                <span></span>
            </div>
            <div class="file-size">${(file.size/(1024*1024)).toFixed(2)} MB</div>
        </div>
        <div class="col">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi-x" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/></svg>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi-check2" viewBox="0 0 16 16"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0"/></svg>
        </div>
    `;

    listContainer.prepend(li)
    var http = new XMLHttpRequest()
    var data = new FormData()
    data.append('userId', 'user_id');
    data.append('name', file.name)
    data.append('type', file.type)
    data.append('size', (file.size/(1024*1024)).toFixed(2))

    http.onload = () => {
      li.classList.add('complete')
      li.classList.remove('in-prog')
      updateButtonStatus();

    }

    http.upload.onprogress = (e) => {
      var percent_complete = (e.loaded / e.total) * 100;
      li.querySelectorAll('span')[0].innerHTML = Math.round(percent_complete) + '%';
      li.querySelectorAll('span')[1].style.width = percent_complete + '%';
    }

    http.open('POST', '/newscan', true);
    http.send(data);
    li.querySelector('.bi-x').onclick = () => http.abort
    http.onabort = () => li.remove()

    //find icon for file
    function iconSelector(type){
    var splitType = (type.split('/')[0] == 'application') ? type.split('/')[1] : type.split('/')[0];
    return splitType + '.png'
  }
}

function handleScanClick(file) {
    const listItems = document.querySelectorAll('.list li');
    var data = listItems.length;
    console.log(`Anzahl der Credits: ${data}`);

    $.ajax({
        url:'/process',
        type: 'POST',
        data: { 'data': data },
        success: function(response) {
            window.location.href = '/history';
        },
        error: function(error) {
            console.error("Error updating credits:", error);
        }
    });
}

function addCredits() {
    $.ajax({
      url: '/add_credits',
      type: 'POST',
      data: { amount: 100 },
      success: function(response) {
        alert('Credits added successfully!');
      },
      error: function(error) {
        alert('Failed to add credits. Please try again.');
        console.error(error);
      }
    });
  }

async function updatePreference(preference) {
    const response = await fetch('/update_preference', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `preference=${preference}`,
    });

    const data = await response.text();
    console.log(data);
}

async function reportScan(scanId) {
const response = await fetch(`/report_scan/${scanId}`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
});

if (response.ok) {
    // Update the UI or do anything you need after reporting the scan
    console.log(`Scan ${scanId} reported successfully`);
} else {
    console.error('Failed to report scan');
}
}

async function unreportScan(scanId) {
const response = await fetch(`/unreport_scan/${scanId}`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
});

if (response.ok) {
    // Update the UI or do anything you need after reporting the scan
    console.log(`Scan ${scanId} unreported successfully`);
} else {
    console.error('Failed to report scan');
}
}


