const sendEmail= async(option)=>{
    try {
        
        const BREVO_API_KEY= process.env.BREVO_API_KEY?.trim();
        if(!BREVO_API_KEY){
            console.error("Missing BREVO_API_KEY in the .env file");
            throw new Error("missing Email Api Key");
        }

        const data={
            sender:{

                name: "NOOR-Estates Platform",
                email: process.env.EMAIL_USER,
            }, to:[{email: option.email}],
            subject: option.subject,
            htmlContent: option.message
        };
         const response = await fetch("https://api.brevo.com/v3/smtp/email", {
           method:"POST",
           headers:{
            "api-key":BREVO_API_KEY,
            "Content-Type":"application/json",
            "Accept":"application/json",

           },
           body: JSON.stringify(data),
    });

    const result= await response.json();

    if(response.ok){
        console.log("Email sent successfully via BREVO",result.messageId);
    }else{
        console.error("BREVO APi Key Error:",result);
        throw new Error(result.message || "Could not send email via BREVO")
    }

    } catch (error) {
        console.error("BREVO Email Error:",error.message);
        throw new Error("Could not send email via BREVO")
    }
};

export default sendEmail;