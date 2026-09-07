import type { Hero, MediaFile } from '../../shared/types'

const image = (id: number, name: string): MediaFile => ({
	id,
	url: `https://images.example.org/heroes/${id}.jpg`,
	thumbnailUrl: `https://images.example.org/heroes/${id}-thumb.jpg`,
	name,
	width: 1200,
	height: 1600,
})

const biography =
	'До войны жил и работал в родном городе, окончил школу и участвовал в жизни района. После начала войны был призван в Красную армию. Прошёл подготовку, служил в стрелковом подразделении и принимал участие в освобождении нескольких городов.'

const feat =
	'В ходе тяжёлого боя взял на себя командование отделением, восстановил связь с соседней частью и обеспечил эвакуацию раненых. Наградной лист отмечает хладнокровие, личную храбрость и заботу о товарищах.'

const awards =
	'Награждён орденом Отечественной войны, медалью «За отвагу» и юбилейными наградами. Сведения подтверждены архивными документами и наградными листами.'

type HeroSeed = {
	firstName: string
	lastName: string
	middleName?: string
	districtId: number
	birthDate?: string
	deathDate?: string
}

const heroSeeds: HeroSeed[] = [
	{
		firstName: 'Александр',
		lastName: 'Александров',
		middleName: 'Михайлович',
		districtId: 1,
		birthDate: '1918-03-14',
		deathDate: '1944-08-02',
	},
	{
		firstName: 'Валентина',
		lastName: 'Белозёрова',
		middleName: 'Константиновна',
		districtId: 2,
		birthDate: '1921-11-03',
		deathDate: '2004-06-21',
	},
	{
		firstName: 'Николай',
		lastName: 'Вершинин',
		middleName: 'Георгиевич',
		districtId: 1,
		birthDate: '1916-07-29',
	},
	{
		firstName: 'Евдокия',
		lastName: 'Голованова',
		middleName: 'Алексеевна',
		districtId: 4,
		birthDate: '1920-01-17',
		deathDate: '1998-09-12',
	},
	{
		firstName: 'Пётр',
		lastName: 'Добронравов',
		middleName: 'Арсеньевич',
		districtId: 1,
		birthDate: '1914-05-08',
		deathDate: '1943-12-19',
	},
	{
		firstName: 'Зоя',
		lastName: 'Ермолаева',
		middleName: 'Семёновна',
		districtId: 1,
		birthDate: '1923-02-05',
	},
	{
		firstName: 'Сергей',
		lastName: 'Журавлёв',
		middleName: 'Владиславович',
		districtId: 7,
		birthDate: '1919-10-25',
		deathDate: '1945-01-18',
	},
	{
		firstName: 'Мария',
		lastName: 'Звягинцева',
		middleName: 'Фёдоровна',
		districtId: 1,
		birthDate: '1922-04-30',
		deathDate: '2011-08-14',
	},
	{
		firstName: 'Анатолий',
		lastName: 'Ильин',
		middleName: 'Васильевич',
		districtId: 1,
		birthDate: '1917-12-09',
	},
	{
		firstName: 'Клавдия',
		lastName: 'Калинина',
		middleName: 'Андреевна',
		districtId: 2,
		birthDate: '1924-06-16',
	},
	{
		firstName: 'Виктор',
		lastName: 'Лебедев-Краснопольский',
		middleName: 'Александрович',
		districtId: 1,
		birthDate: '1915-09-11',
		deathDate: '1942-07-07',
	},
	{
		firstName: 'Надежда',
		lastName: 'Максимова',
		middleName: 'Ильинична',
		districtId: 4,
	},
	{
		firstName: 'Михаил',
		lastName: 'Новосельцев',
		middleName: 'Григорьевич',
		districtId: 5,
		birthDate: '1913-01-22',
		deathDate: '1987-03-06',
	},
	{
		firstName: 'Лидия',
		lastName: 'Орлова',
		middleName: 'Петровна',
		districtId: 6,
		birthDate: '1925-08-19',
	},
	{
		firstName: 'Иван',
		lastName: 'Панфилов',
		middleName: 'Никитич',
		districtId: 1,
		birthDate: '1910-02-28',
		deathDate: '1944-10-03',
	},
	{
		firstName: 'Антонина',
		lastName: 'Рождественская',
		middleName: 'Владимировна',
		districtId: 8,
		birthDate: '1919-05-13',
		deathDate: '2001-12-02',
	},
	{
		firstName: 'Георгий',
		lastName: 'Соколов',
		middleName: 'Евгеньевич',
		districtId: 1,
		birthDate: '1920-10-01',
	},
	{
		firstName: 'Тамара',
		lastName: 'Тихомирова',
		middleName: 'Николаевна',
		districtId: 2,
		birthDate: '1926-03-27',
	},
	{
		firstName: 'Борис',
		lastName: 'Устинов',
		middleName: 'Аркадьевич',
		districtId: 3,
		birthDate: '1912-07-04',
		deathDate: '1943-02-15',
	},
	{
		firstName: 'Раиса',
		lastName: 'Федотова',
		middleName: 'Матвеевна',
		districtId: 4,
		birthDate: '1921-09-09',
	},
	{
		firstName: 'Дмитрий',
		lastName: 'Харитонов',
		middleName: 'Павлович',
		districtId: 5,
		deathDate: '1945-04-20',
	},
	{
		firstName: 'Аграфена',
		lastName: 'Цветкова',
		middleName: 'Афанасьевна',
		districtId: 6,
		birthDate: '1918-12-31',
		deathDate: '1994-05-18',
	},
	{
		firstName: 'Алексей',
		lastName: 'Черепанов',
		middleName: 'Константинович',
		districtId: 7,
		birthDate: '1916-04-12',
	},
	{
		firstName: 'Екатерина',
		lastName: 'Шереметьева',
		middleName: 'Владиславовна',
		districtId: 8,
		birthDate: '1923-11-24',
	},
]

export const heroFixtures: Hero[] = heroSeeds.map((seed, index) => {
	const id = index + 1
	const hasMainImage = id !== 12
	const mainImage = image(
		100 + id,
		`Портрет: ${seed.lastName} ${seed.firstName}`,
	)
	const gallery =
		id === 5
			? [
					image(300 + id * 4, 'Фотография из семейного архива'),
					image(301 + id * 4, 'Фронтовые товарищи'),
					image(302 + id * 4, 'Наградной лист'),
					image(303 + id * 4, 'Послевоенная фотография'),
				]
			: id === 12
				? []
				: id % 4 === 0
			? [
					image(200 + id * 2, 'Фотография из семейного архива'),
					image(201 + id * 2, 'Наградной лист'),
				]
			: id % 3 === 0
				? [image(200 + id * 2, 'Архивная фотография')]
				: []

	return {
		id,
		...seed,
		...(hasMainImage ? { mainImage } : {}),
		...(id % 6 !== 0 ? { biography } : {}),
		...(id % 5 !== 0 ? { feat } : {}),
		...(id % 4 !== 0 ? { awards } : {}),
		gallery,
		status: id % 7 === 0 ? 'draft' : 'published',
	}
})
