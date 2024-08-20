const { Client } = require('pg');
const inquirer = require('inquirer');

// Create a new PostgreSQL client
const client = new Client({
    user: 'corgi',        // replace with your PostgreSQL username
    host: 'localhost',
    database: 'employee_tracker',
    password: 'password', // replace with your PostgreSQL password
    port: 5432,
});

// Connect to the database
client.connect()
    .then(() => console.log('Connected to the database.'))
    .catch(err => console.error('Connection error', err.stack));


    // Function to display the main menu
function mainMenu() {
    inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
                'View All Departments',
                'View All Roles',
                'View All Employees',
                'Add a Department',
                'Add a Role',
                'Add an Employee',
                'Update an Employee Role',
                'Exit'
            ]
        }
    ]).then(answer => {
        switch (answer.action) {
            case 'View All Departments':
                viewDepartments();
                break;
            case 'View All Roles':
                viewRoles();
                break;
            case 'View All Employees':
                viewEmployees();
                break;
            case 'Add a Department':
                addDepartment();
                break;
            case 'Add a Role':
                addRole();
                break;
            case 'Add an Employee':
                addEmployee();
                break;
            case 'Update an Employee Role':
                updateEmployeeRole();
                break;
            case 'Exit':
                client.end();
                break;
            default:
                console.log(`Invalid action: ${answer.action}`);
                mainMenu();
        }
    });
}

function viewDepartments() {
    const query = 'SELECT * FROM department';
    client.query(query)
        .then(res => {
            console.table(res.rows);
            mainMenu();  // Return to the main menu after displaying the table
        })
        .catch(err => console.error('Error executing query', err.stack));
}




// Call the main menu function
mainMenu();
