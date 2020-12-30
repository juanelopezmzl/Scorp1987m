const
    { Pool } = require('pg'),
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    /**
     * 
     * @param {*} value 
     * @returns {string}
     */
const getString = (value) => {
    if(value instanceof Date) return value.toISOString();
    else return `${value}`;
}

module.exports = {
    /**
     * 
     * @param {String} sql - SQL Query statement to execute
     * @returns - return the query result
     * 
     * Execute SQL query and return the result
     */
    async executeQueryAsync(sql){
        let client;

        try{
            client = await pool.connect();
            const result = await client.query(sql);
            return result;
        }
        finally{
            if(client)
                client.release();
        }
    },

    /**
     * 
     * @param item - Object to convert to insert sql string
     * @param {string[]} insertableFields - Fields that are allowed to insert to database
     * @returns - Return part of sql string for insert (field1,field2,...)VALUES('value1','value2',...)
     * 
     * Generate insert string from item and insertableFields
     */
    getInsertFieldString(item, insertableFields){
        let colstr = '';
        let valstr = '';
        insertableFields.forEach(function(key){
            if(key in item){
                colstr += `,${key}`;
                valstr += ',';
                valstr += (item[key] != null) ? `'${getString(item[key])}'` : 'NULL';
            }
        });
        colstr = (colstr.length>0) ? colstr.substring(1) : '';
        valstr = (valstr.length>0) ? valstr.substring(1) : '';
        return `(${colstr})VALUES(${valstr})`;
    },

    /**
     * 
     * @param item - Object to convert to update sql string
     * @param {string[]} updatableFields - Fields that are allowed to update to database
     * @returns - Return part of sql string for update field1='value1',field2='value2',...
     * 
     * Generate update string from item and updatableFields
     */
    getUpdateValueString(item, updatableFields){
        let valstr = '';
        updatableFields.forEach(function(key){
            if(key in item){
                valstr += `,${key}=`;
                valstr += (item[key] != null) ? `'${getString(item[key])}'` : 'NULL';
            }
        });
        valstr = (valstr.length>0) ? valstr.substring(1) : '';
        return valstr;
    },

    /**
     * 
     * @param {Array} values - list of values
     * @returns - return part of sql string for select 'value1','value2',...
     * 
     * Generate select in string from values
     */
    getInValueString(values){
        let str = '';
        values.forEach(function (key){
            str += `,'${getString(key)}'`;
        });
        str = (str.length>0) ? str.substring(1) : '';
        return str;
    },

    /**
     * 
     * @param {Dict<any>} values 
     */
    getWhereString(values){
        if(!values) return null;
        let str = '';
        values.forEach(function (key){
            str += `,${key}='${getString(values[key])}'`;
        });
        str = (str.length>0) ? str.substring(1) : '';
        return str;
    },

    /**
     * 
     * @param result - QueryResult from pool
     * @returns - return first object from QueryResult.rows if found otherwise null
     * 
     * Get the first object row from QueryResult
     */
    getObject(result){
        if(result){
            if(result.rowCount > 0)
                return result.rows[0];
            else
                return null;
        }
        else
            return null;
    },

    /**
     * 
     * @param result - QueryResult from pool
     * @returns - return all object from QueryResult.rows if found, otherwise null
     * 
     * Get array of object from QueryResult
     */
    getArray(result){
        if(result){
            if(result.rowCount > 0)
                return result.rows;
            else
                return null;
        }
        else
            return null;
    }
}