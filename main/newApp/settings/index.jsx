function mySettings(props) 
{
  return (
   <Page>

      <Section title={<Text bold align="center">Normalization</Text>}>    
        <Select
          label={`Alert Sensitivity`}
          settingsKey="normalization"
          options={[ // Values from [-1.0, -3.0]
            {value: -1, name: "100 (More Sensitive)"},
            {value: -1.1, name: "95"},
            {value: -1.2, name: "90"},
            {value: -1.3, name: "85"},
            {value: -1.4, name: "80"},
            {value: -1.5, name: "75"},
            {value: -1.6, name: "70"},
            {value: -1.7, name: "65"},
            {value: -1.8, name: "60"},
            {value: -1.9, name: "55"},
            {value: -2.0, name: "50 (Default)"},
            {value: -2.1, name: "45"},
            {value: -2.2, name: "40"},
            {value: -2.3, name: "35"},
            {value: -2.4, name: "30"},
            {value: -2.5, name: "25"},
            {value: -2.6, name: "20"},
            {value: -2.7, name: "15"},
            {value: -2.8, name: "10"},
            {value: -2.9, name: "05"},
            {value: -3.0, name: "00  (Less sensitve)"}]}
        />
      </Section> 
      
      <Section title={<Text bold align="center">Customize Your Alert Message</Text>}>   
      <TextInput
          title = "Customize your alert"
          label="Please enter your message"
          placeholder = "Enter your message here"
          settingsKey="alertText"
         />
      </Section> 
     
    </Page>
  );
}
registerSettingsPage(mySettings);