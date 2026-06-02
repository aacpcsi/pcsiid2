console.log("PCSI Script Loading...");

// Supabase Configuration
const supabaseUrl = 'https://hzojnvcgzsuhmaskbnfp.supabase.co';
const supabaseKey = 'sb_publishable_9NhPZGV9uEXj0xqzH4PngQ_OKYKl25l';

let supabase;
try {
    // Try to detect the Supabase global from CDN
    const supabaseLib = window.supabase || window.supabasejs;
    if (supabaseLib) {
        supabase = supabaseLib.createClient(supabaseUrl, supabaseKey);
        console.log("Supabase Client Initialized");
    } else {
        console.error("Supabase library not found! Check CDN connection.");
    }
} catch (e) {
    console.error("Error initializing Supabase:", e);
}

// DOM Elements
const inputs = {
    companyId: document.getElementById('companyId'),
    fullName: document.getElementById('fullName'),
    contactNumber: document.getElementById('contactNumber'),
    email: document.getElementById('email'),
    emergencyName: document.getElementById('emergencyName'),
    emergencyContact: document.getElementById('emergencyContact'),
    philHealth: document.getElementById('philHealth'),
    sss: document.getElementById('sss'),
    tin: document.getElementById('tin'),
    pagIbig: document.getElementById('pagIbig'),
    birthday: document.getElementById('birthday'),
    idPicture: document.getElementById('idPictureInput'),
    signature: document.getElementById('signatureInput')
};

const displays = {
    name: document.getElementById('displayName'),
    id: document.getElementById('displayId'),
    contact: document.getElementById('displayContact'),
    emergencyName: document.getElementById('displayEmergencyName'),
    emergencyContact: document.getElementById('displayEmergencyContact'),
    photo: document.getElementById('userPhotoPreview'),
    signature: document.getElementById('signaturePreviewContainer')
};

const generateBtn = document.getElementById('generateBtn');
const qrContainer = document.getElementById('qrcode');

// Initialize QR Code
let qrcode;
try {
    qrcode = new QRCode(qrContainer, {
        text: "{}",
        width: 120,
        height: 120,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
    console.log("QRCode Initialized");
} catch (e) {
    console.error("Error initializing QRCode:", e);
}

// Update Preview Functions
function updatePreview() {
    console.log("Updating Preview...");
    if (displays.name) displays.name.innerText = inputs.fullName.value || 'FULL NAME';
    if (displays.id) displays.id.innerText = inputs.companyId.value || 'PCSI-0000-000';
    if (displays.contact) displays.contact.innerText = inputs.contactNumber.value || '+63 9XX XXX XXXX';
    if (displays.emergencyName) displays.emergencyName.innerText = inputs.emergencyName.value || 'NAME';
    if (displays.emergencyContact) displays.emergencyContact.innerText = inputs.emergencyContact.value || 'CONTACT NUMBER';
    
    updateQR();
}

function updateQR() {
    const hiddenData = {
        philHealth: inputs.philHealth.value,
        sss: inputs.sss.value,
        tin: inputs.tin.value,
        pagIbig: inputs.pagIbig.value,
        email: inputs.email.value,
        birthday: inputs.birthday.value
    };
    if (qrcode) {
        qrcode.clear();
        qrcode.makeCode(JSON.stringify(hiddenData));
    }
}

// File Readers
function handleFileSelect(input, displayElement, isSignature = false) {
    console.log("File selected for:", isSignature ? "signature" : "photo");
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (isSignature) {
                displayElement.innerHTML = `<img src="${e.target.result}" class="signature-img">`;
            } else {
                displayElement.innerHTML = `<img src="${e.target.result}" class="user-photo">`;
                displayElement.classList.remove('user-photo-placeholder');
            }
        };
        reader.readAsDataURL(file);
    }
}

// Event Listeners for Live Preview
console.log("Attaching event listeners...");
Object.values(inputs).forEach(input => {
    if (!input) return;
    if (input.type === 'text' || input.type === 'email' || input.type === 'date') {
        input.addEventListener('input', updatePreview);
    }
});

if (inputs.idPicture) inputs.idPicture.addEventListener('change', () => handleFileSelect(inputs.idPicture, displays.photo));
if (inputs.signature) inputs.signature.addEventListener('change', () => handleFileSelect(inputs.signature, displays.signature, true));

// PDF Export & Supabase Save
if (generateBtn) {
    generateBtn.addEventListener('click', async () => {
        console.log("Generate Button Clicked");
        const frontCard = document.getElementById('frontCard');
        const backCard = document.getElementById('backCard');
        
        generateBtn.innerText = 'Processing...';
        generateBtn.disabled = true;

        try {
            console.log("Capturing cards with html2canvas...");
            // Capture Cards
            const frontCanvas = await html2canvas(frontCard, { scale: 3, useCORS: true, allowTaint: true });
            const backCanvas = await html2canvas(backCard, { scale: 3, useCORS: true, allowTaint: true });

            console.log("Creating PDF...");
            // Create PDF (Standard CR80 size: 54x86mm)
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [54, 86]
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            pdf.addImage(frontCanvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.addPage([54, 86], 'portrait');
            pdf.addImage(backCanvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);

            pdf.save(`ID_${inputs.fullName.value || 'User'}.pdf`);
            console.log("PDF Saved locally");

            // Save to Supabase
            if (supabase) {
                console.log("Saving to Supabase...");
                const record = {
                    companyId: inputs.companyId.value,
                    fullName: inputs.fullName.value,
                    contactNumber: inputs.contactNumber.value,
                    email: inputs.email.value,
                    emergencyName: inputs.emergencyName.value,
                    emergencyContact: inputs.emergencyContact.value,
                    philHealth: inputs.philHealth.value,
                    sss: inputs.sss.value,
                    tin: inputs.tin.value,
                    pagIbig: inputs.pagIbig.value,
                    birthday: inputs.birthday.value,
                    created_at: new Date().toISOString()
                };

                const { error } = await supabase.from('id_records').insert([record]);
                if (error) {
                    console.error("Supabase Error:", error);
                    alert('Supabase Error: ' + error.message);
                } else {
                    console.log("Saved to Supabase successfully");
                    alert('ID Generated and Saved Successfully!');
                }
            } else {
                console.warn("Supabase not connected, skipping save.");
                alert('ID Generated Locally (Supabase was not connected).');
            }

        } catch (error) {
            console.error('General Error:', error);
            alert('An error occurred: ' + error.message);
        } finally {
            generateBtn.innerText = 'Generate & Export ID';
            generateBtn.disabled = false;
        }
    });
}

// Initial Preview Update
console.log("Running initial preview...");
updatePreview();
console.log("Script Setup Complete.");
