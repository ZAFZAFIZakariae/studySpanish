/*Inserción de tuplas en la tabla DEPARTAMENTO*/
INSERT INTO departamento 
	VALUES('DSIC','Sistemas Informáticos y Computación','V. Vitto','3500');
INSERT INTO departamento 
	VALUES('DISCA','Ingeniería de Sistemas y Automática','A. Crespo','6400');

/*Inserción de tuplas en la tabla PROFESOR*/
INSERT INTO profesor VALUES('JCC','Juan Carlos Casamayor','3523','DSIC');
INSERT INTO profesor VALUES('MCG','Matilde Celma Giménez','3234','DISCA');
INSERT INTO profesor VALUES('MJV','Maria José Vicent','3666','DSIC');
INSERT INTO profesor VALUES('LMH','Laura Mota Herranz','3754','DSIC');
INSERT INTO profesor VALUES('MAP','Maria Ángeles Pastor','1254','DISCA');

/*Inserción de tuplas en la tabla ASIGNATURA*/
INSERT INTO asignatura VALUES('BDA','Bases de Datos','3A',4.5,1.5,'DSIC');
INSERT INTO asignatura VALUES('AD3','Algoritmos','2B',3,3,'DSIC');
INSERT INTO asignatura VALUES('BDV','Bases de Datos Avanzadas','5A',3,3,'DSIC');
INSERT INTO asignatura VALUES('APB','Aplicaciones de BD','3B',3,3,'DSIC');
INSERT INTO asignatura VALUES('SO','Sistemas Operativos','2A',3,3,'DISCA');
INSERT INTO asignatura VALUES('TGD','Tecnologías de Gestión de Datos','1A',3,3,'DSIC');

/*Inserción en la tabla ASG_MASTER*/ 
INSERT INTO asg_master VALUES('TGD','MITSS');

/*Inserción de tuplas en la tabla DOCENCIA*/
INSERT INTO docencia VALUES('MCG','SO',1,1);
INSERT INTO docencia VALUES('MCG','BDA',2,1);
INSERT INTO docencia VALUES('MCG','AD3',1,1);
INSERT INTO docencia VALUES('JCC','BDA',1,2);
INSERT INTO docencia VALUES('JCC','TGD',1,1);
INSERT INTO docencia VALUES('MJV','BDA',1,2);
INSERT INTO docencia VALUES('MJV','BDV',1,2);
INSERT INTO docencia VALUES('LMH','BDA',0,2);
INSERT INTO docencia VALUES('MJV','APB',1,3);

commit;
