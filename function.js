Date.prototype.addDays = function(days) {
    this.setDate(this.getDate() + parseFloat(days));
    return this;
};



//global
let date_display_format = "DD-MM-YYYY";
let global_fortnightly_payments = 26;
let global_monthly_payments = 12;
let global_interst_rate = 8.5;
let global_setup_fee = 20;

//Output Fields
let o_end_date = $('#o_end_date');
let o_annual_cost = $('#o_annual_cost');
let o_2nd_dd_date = $('#o_2nd_dd_date');
let o_last_dd_date = $('#o_last_dd_date');
let o_no_of_payments= $('#o_no_of_payments');
let o_first_payment = $('#o_first_payment');
let o_last_payment = $('#o_last_payment');
let o_regular_dd_amount = $('#o_regular_dd_amount');
let o_daily_dd_amount = $('#o_daily_dd_amount');
let o_total_amount = $('#o_total_amount');

$(document).ready(function(){

    moment.lang('en-AU');

    document.getElementById("loan-form").addEventListener("submit", function(e) {
        // Hide Results
        document.getElementById("result").style.display = "none";
      
        // Show Loader
        document.getElementById("loading").style.display = "block";
      
        setTimeout(calculateResults, 1000);
      
        e.preventDefault();
    });

});

function calculateResults() {

    //input variables
    let i_policy_amount = parseFloat($('#i_policy_amount').val());
    let i_frequency = $('#i_frequency');
    let policy_start_date = moment($('#i_policy_start_date').val(), date_display_format);
    let i_payment_start_date = moment($('#i_payment_start_date').val(), date_display_format);
    let i_policy_issue_date = moment($('#i_policy_issue_date').val(), date_display_format)

    let postData = {
        PolicyAmount: i_policy_amount,
        Frequency: i_frequency.val(),
        PolicyIssueDate: i_policy_issue_date.format(date_display_format),
        PaymentStartDate: i_payment_start_date.format(date_display_format),
        PolicyStartDate: policy_start_date.format(date_display_format),
        AccessKey: "24224346-4f0f-4932-960b-dd1d70c3e996"
    }

    $.ajax({
        type: "POST",
        url: 'https://api-dev.premiumfunding.nz/nzfs/calculate/premium/private',
        dataType: 'json',
        async: false,
        data: JSON.stringify(postData),
        success: function(response){
            console.log(response)
            $('#result_p').text(JSON.stringify(response, null, '\t'))
        },
        error: function(response){
            $('#result_p').text(JSON.stringify(response.responseJSON, null, '\t'))
        }

    })

    //shared variables
    let o_2nd_dd_date_value;
    let number_of_payments = 0;
    let o_last_dd_date_value;
    let days =  i_frequency.val() == 'fortnightly' ? global_fortnightly_payments : global_monthly_payments;
    let annual_cost_val;
    let daily_dd_amount_value;
    let o_first_payment_value;
    let o_regular_dd_amount_value;

    //Step 1
    // Calculate end date
    let o_end_date_val = policy_start_date.clone().add(364, 'days');
    o_end_date.val(o_end_date_val.format(date_display_format));

    //Calculate no of payments
    let i_frequency_val = i_frequency.val();
    if( i_frequency.val() == 'fortnightly' ){
        
        // if(
        //     F13<Eomonth(C13,-1)+14,index($C$2:$C$3,match(E13,$B$2:$B$3,0)),
        //         ROUNDUP(MIN(index($C$2:$C$3,match(E13,$B$2:$B$3,0)),DATEDIF(F13-1,G13,"D")/14),0)
        // ),

        let policy_start_date_end_of_month = policy_start_date.clone().subtract(1, 'month').endOf('month');
        
        //F13<Eomonth(C13,-1)+14
        if( i_payment_start_date.format("MM-DD-YYYY") < policy_start_date_end_of_month.add(14, 'days').format("MM-DD-YYYY") ){
            //index($C$2:$C$3,match(E13,$B$2:$B$3,0))
            number_of_payments = global_fortnightly_payments;
            o_no_of_payments.val(global_fortnightly_payments);

        } else {
            //ROUNDUP(MIN(index($C$2:$C$3,match(E13,$B$2:$B$3,0)),DATEDIF(F13-1,G13,"D")/14),0)

            //DATEDIF(F13-1,G13,"D")
            let f_1 = o_end_date_val.diff(i_payment_start_date.clone().subtract(1, 'day').format("MM-DD-YYYY"), 'days');

            let f_2 = Math.ceil(Math.min.apply(Math, [ global_fortnightly_payments, f_1/14]));
            number_of_payments = f_2;
            o_no_of_payments.val(f_2);
        }

    } else {

        // if(
        //     F13<Eomonth(C13,0),index($C$2:$C$3,match(E13,$B$2:$B$3,0)),
        //         MIN(index($C$2:$C$3,match(E13,$B$2:$B$3,0)),DATEDIF(F13-1,G13,"M"))
        // )

        let policy_start_date_end_of_month = policy_start_date.clone().endOf('month');

        if( i_payment_start_date.format("MM-DD-YYYY") < policy_start_date_end_of_month.format("MM-DD-YYYY") ){

            number_of_payments = global_monthly_payments;
            o_no_of_payments.val(global_monthly_payments);

        } else {

            //DATEDIF(F13-1,G13,"M")
            let f_3 = Math.abs(o_end_date_val.diff(i_payment_start_date.subtract(1, 'day').format("MM-DD-YYYY"), 'months'));

            let f_4 = Math.ceil(Math.min.apply(Math, [ global_monthly_payments, f_3]));
            number_of_payments = f_4;
            o_no_of_payments.val(f_4);

        }
    
    }
    number_of_payments = parseFloat(number_of_payments);
    //------> End of Step 1

    //Step 2 - Calculate Annual Cost
    //=(D9*(1+$C$4)+index($C$2:$C$3,match(E9,$B$2:$B$3,0))+$C$5)
    annual_cost_val = parseFloat(i_policy_amount * (1 + (global_interst_rate/100)) + days + global_setup_fee);
    o_annual_cost.val(annual_cost_val);

    //Step 3 - Calculate 2nd DD Date
    //=if(E9="Fortnightly",F9+14,EOmonth(F9,0)+F9- EOmonth(F9,-1))
    if( i_frequency.val() == 'fortnightly' ){
        o_2nd_dd_date_value = moment(i_payment_start_date).add(14, 'days');
        o_2nd_dd_date.val(o_2nd_dd_date_value.format(date_display_format));
    } else {
        o_2nd_dd_date_value = moment(i_payment_start_date).add(1, 'month');
        o_2nd_dd_date.val(o_2nd_dd_date_value.format(date_display_format));
    }

    //Step 4 - Calculate LAst DD DAte
    //=if(E10="Fortnightly",F10+(K10-1)*index($D$2:$D$3,match(E10,$B$2:$B$3,0)),eomonth(F10,K10-2)+F10-Eomonth(F10,-1))
    if( i_frequency.val() == 'fortnightly' ){
        o_last_dd_date_value = i_payment_start_date.clone().add((number_of_payments-1)*2,'weeks');
        o_last_dd_date.val(o_last_dd_date_value.format(date_display_format));
        
    } else {
        o_last_dd_date_value = i_payment_start_date.clone().add((number_of_payments-1),'months');
        o_last_dd_date.val(o_last_dd_date_value.format(date_display_format));
    }

    //Step 5 - Calculate Daily DD
    daily_dd_amount_value = ((annual_cost_val - global_setup_fee)/365).toFixed(2);
    o_daily_dd_amount.val(daily_dd_amount_value);


    //Step 6 - Calculate First Payment
    //=if(F9<C9,(H9-$C$5)/index($C$2:$C$3,match(E9,$B$2:$B$3,0))+$C$5,(I9-C9)*O9+$C$5)
    if( i_payment_start_date < policy_start_date ){
        o_first_payment_value = parseFloat((((annual_cost_val - global_setup_fee) / days) + global_setup_fee).toFixed(2));
        o_first_payment.val(o_first_payment_value);
    } else {
        let diff = Math.abs(o_2nd_dd_date_value.diff(policy_start_date, 'days'));
        o_first_payment_value = parseFloat(((diff * daily_dd_amount_value) + global_setup_fee).toFixed(2));
        o_first_payment.val(o_first_payment_value);
    }

    //Step 7 - Calculate Regular DD Amount
    o_regular_dd_amount_value = parseFloat(((annual_cost_val - global_setup_fee ) / days).toFixed(2));
    o_regular_dd_amount.val(o_regular_dd_amount_value);

    //Step 8 - Calculate Last Payment
    let o_last_payment_value = parseFloat(( annual_cost_val - o_first_payment_value - (o_regular_dd_amount_value * ( number_of_payments - 2 )) ).toFixed(2));
    o_last_payment.val(o_last_payment_value);

    //Step 9 - total amount

    o_total_amount.val(o_first_payment_value + o_last_payment_value + ( o_regular_dd_amount_value * ( number_of_payments - 2 ) ));

    // Show Results
    document.getElementById("result").style.display = "block";
  
    // Hide Loader
    document.getElementById("loading").style.display = "none";

}