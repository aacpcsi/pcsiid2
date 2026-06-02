// Supabase Configuration
const supabaseUrl = 'https://hzojnvcgzsuhmaskbnfp.supabase.co';
const supabaseKey = 'sb_publishable_9NhPZGV9uEXj0xqzH4PngQ_OKYKl25l';
const supabase = supabasejs.createClient(supabaseUrl, supabaseKey);

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
let qrcode = new QRCode(qrContainer, {
    text: "{}",
    width: 120,
    height: 120,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
});

// Update Preview Functions
function updatePreview() {
    displays.name.innerText = inputs.fullName.value || 'FULL NAME';
    displays.id.innerText = inputs.companyId.value || 'PCSI-0000-000';
    displays.contact.innerText = inputs.contactNumber.value || '+63 9XX XXX XXXX';
    displays.emergencyName.innerText = inputs.emergencyName.value || 'NAME';
    displays.emergencyContact.innerText = inputs.emergencyContact.value || 'CONTACT NUMBER';
    
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
    qrcode.clear();
    qrcode.makeCode(JSON.stringify(hiddenData));
}

// File Readers
function handleFileSelect(input, displayElement, isSignature = false) {
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
Object.values(inputs).forEach(input => {
    if (input.type === 'text' || input.type === 'email' || input.type === 'date') {
        input.addEventListener('input', updatePreview);
    }
});

inputs.idPicture.addEventListener('change', () => handleFileSelect(inputs.idPicture, displays.photo));
inputs.signature.addEventListener('change', () => handleFileSelect(inputs.signature, displays.signature, true));

// PDF Export & Supabase Save
generateBtn.addEventListener('click', async () => {
    const frontCard = document.getElementById('frontCard');
    const backCard = document.getElementById('backCard');
    
    generateBtn.innerText = 'Processing...';
    generateBtn.disabled = true;

    try {
        // Capture Cards
        const frontCanvas = await html2canvas(frontCard, { scale: 3, useCORS: true });
        const backCanvas = await html2canvas(backCard, { scale: 3, useCORS: true });

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

        // Save to Supabase
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

        if (error) throw error;
        alert('ID Generated and Saved Successfully!');

    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please check the console.');
    } finally {
        generateBtn.innerText = 'Generate & Export ID';
        generateBtn.disabled = false;
    }
});

// Initial Preview Update
updatePreview();
