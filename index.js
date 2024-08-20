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

function viewRoles() {
    const query = `
    SELECT role.id, role.title, department.name AS department, role.salary
    FROM role
    LEFT JOIN department ON role.department_id = department.id`;
    client.query(query)
        .then(res => {
            console.table(res.rows);
            mainMenu();  // Return to the main menu after displaying the table
        })
        .catch(err => console.error('Error executing query', err.stack));
}

function viewEmployees() {
    const query = `
    SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS department, role.salary, 
           CONCAT(manager.first_name, ' ', manager.last_name) AS manager
    FROM employee
    LEFT JOIN role ON employee.role_id = role.id
    LEFT JOIN department ON role.department_id = department.id
    LEFT JOIN employee manager ON employee.manager_id = manager.id`;
    client.query(query)
        .then(res => {
            console.table(res.rows);
            mainMenu();  // Return to the main menu after displaying the table
        })
        .catch(err => console.error('Error executing query', err.stack));
}

function addDepartment() {
    inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'Enter the name of the department:'
        }
    ]).then(answer => {
        const query = 'INSERT INTO department (name) VALUES ($1)';
        client.query(query, [answer.name])
            .then(() => {
                console.log(`Added ${answer.name} to departments.`);
                mainMenu();  // Return to the main menu after adding the department
            })
            .catch(err => console.error('Error executing query', err.stack));
    });
}

function addRole() {
    client.query('SELECT id, name FROM department')
        .then(res => {
            const departments = res.rows.map(dept => ({
                name: dept.name,
                value: dept.id
            }));

            inquirer.prompt([
                {
                    type: 'input',
                    name: 'title',
                    message: 'Enter the title of the role:'
                },
                {
                    type: 'input',
                    name: 'salary',
                    message: 'Enter the salary for this role:'
                },
                {
                    type: 'list',
                    name: 'department_id',
                    message: 'Select the department for this role:',
                    choices: departments
                }
            ]).then(answers => {
                const query = 'INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)';
                client.query(query, [answers.title, answers.salary, answers.department_id])
                    .then(() => {
                        console.log(`Added ${answers.title} to roles.`);
                        mainMenu();  // Return to the main menu after adding the role
                    })
                    .catch(err => console.error('Error executing query', err.stack));
            });
        })
        .catch(err => console.error('Error fetching departments', err.stack));
}

function addEmployee() {
    client.query('SELECT id, title FROM role')
        .then(res => {
            const roles = res.rows.map(role => ({
                name: role.title,
                value: role.id
            }));

            inquirer.prompt([
                {
                    type: 'input',
                    name: 'first_name',
                    message: 'Enter the employee\'s first name:'
                },
                {
                    type: 'input',
                    name: 'last_name',
                    message: 'Enter the employee\'s last name:'
                },
                {
                    type: 'list',
                    name: 'role_id',
                    message: 'Select the role for this employee:',
                    choices: roles
                },
                {
                    type: 'input',
                    name: 'manager_id',
                    message: 'Enter the manager ID for this employee (leave blank if none):'
                }
            ]).then(answers => {
                const query = 'INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)';
                client.query(query, [answers.first_name, answers.last_name, answers.role_id, answers.manager_id || null])
                    .then(() => {
                        console.log(`Added ${answers.first_name} ${answers.last_name} to employees.`);
                        mainMenu();  // Return to the main menu after adding the employee
                    })
                    .catch(err => console.error('Error executing query', err.stack));
            });
        })
        .catch(err => console.error('Error fetching roles', err.stack));
}

function updateEmployeeRole() {
    // First, retrieve the list of employees to choose from
    client.query('SELECT id, first_name, last_name FROM employee')
        .then(res => {
            const employees = res.rows.map(emp => ({
                name: `${emp.first_name} ${emp.last_name}`,
                value: emp.id
            }));

            // Then, retrieve the list of roles
            client.query('SELECT id, title FROM role')
                .then(roleRes => {
                    const roles = roleRes.rows.map(role => ({
                        name: role.title,
                        value: role.id
                    }));

                    // Prompt the user to select an employee and a new role
                    inquirer.prompt([
                        {
                            type: 'list',
                            name: 'employee_id',
                            message: 'Select the employee whose role you want to update:',
                            choices: employees
                        },
                        {
                            type: 'list',
                            name: 'role_id',
                            message: 'Select the new role for this employee:',
                            choices: roles
                        }
                    ]).then(answers => {
                        const query = 'UPDATE employee SET role_id = $1 WHERE id = $2';
                        client.query(query, [answers.role_id, answers.employee_id])
                            .then(() => {
                                console.log('Employee role updated successfully.');
                                mainMenu();  // Return to the main menu after updating the role
                            })
                            .catch(err => console.error('Error executing query', err.stack));
                    });
                })
                .catch(err => console.error('Error fetching roles', err.stack));
        })
        .catch(err => console.error('Error fetching employees', err.stack));
}

// Call the main menu function
mainMenu();
