const { z } = require("zod");

const PaymentInitiateSchema = z.object({
    // Required Base Fields for Payment ID creation
    student_roll: z.string().min(1, "Student Roll Number is required"),
    student_name: z.string().min(1, "Student Name is required"),
    amount: z.preprocess(
        (a) => parseFloat(a),
        z.number().positive("Amount must be positive")
    ),
    payment_category: z.enum([
        "UNIVERSITY_EXAMINATION",
        "PHD_FEE",
        "CERTIFICATE",
        "ADMISSION",
        "AFFILIATION",
        "HOSTEL_FEE", // Assuming this exists based on logic context
        "OTHER_FEE"
    ]),
    payment_type: z.string().optional(), // Often synonymous with category or sub-category

    // Optional but recommended
    email: z.string().email().optional().or(z.literal("")),
    mobile: z.string().regex(/^[0-9]{10}$/).optional().or(z.literal("")),

    // Contextual Fields (Depends on Payment Category)
    father_name: z.string().optional(),
    study_status: z.string().optional(),
    year: z.string().optional(),
    semester: z.string().optional(),
    college_code: z.string().optional(),
    college_name: z.string().optional(),
    branch_code: z.string().optional(),
    branch_name: z.string().optional(),
    course: z.string().optional(),
    roll_number: z.string().optional(),

    // Specific Fee Details
    payment_subtype: z.string().optional(), // Used for exam_type, certificate_type, affiliation_type
    remarks: z.string().optional(),
    department: z.string().optional(),
    fee_type: z.string().optional(),
    approval_letter_ref: z.string().optional(),
    admission_ref: z.string().optional(),
    branch: z.string().optional(),
    category: z.string().optional(),
    gender: z.string().optional(),
    dob: z.string().optional(),
    aadhar: z.string().optional(),
    address: z.string().optional(),
    multiAccountInstructionDtls: z.string().optional(),
}).superRefine((data, ctx) => {
    // Add specific checks if necessary
    if (data.payment_category === "UNIVERSITY_EXAMINATION" && !data.semester) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Semester is required for University Examination",
            path: ["semester"],
        });
    }
    if (data.payment_category === "PHD_FEE" && !data.fee_type) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Fee Type is required for PhD Fee",
            path: ["fee_type"],
        });
    }

    if (data.multiAccountInstructionDtls) {
        const splitString = data.multiAccountInstructionDtls.replace(/{AMOUNT}/g, String(data.amount));
        const splits = splitString.split('||');
        let sum = 0;
        for (const split of splits) {
            const parts = split.split('|');
            if (parts.length > 0 && !isNaN(parts[0])) {
                sum += parseFloat(parts[0]);
            }
        }
        
        // Use a small epsilon for floating point comparison if necessary, but amounts should be exact
        if (Math.abs(sum - data.amount) > 0.01) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Sum of split amounts (${sum}) does not match the total amount (${data.amount})`,
                path: ["multiAccountInstructionDtls"],
            });
        }
    }
});

module.exports = { PaymentInitiateSchema };
